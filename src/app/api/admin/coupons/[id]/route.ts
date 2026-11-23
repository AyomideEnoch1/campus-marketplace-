import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { normalizeCouponCode } from "@/lib/coupons";

export const dynamic = "force-dynamic";

const updateCouponSchema = z.object({
  code: z.string().min(3).max(30).optional(),
  maxRedemptions: z.number().int().min(1).max(10000).optional(),
  freePeriodDays: z.number().int().min(1).max(3650).optional(),
  inactivityDays: z.number().int().min(1).max(365).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/admin/coupons/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status")?.toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            actor: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const whereRedemptions: any = { couponId: coupon.id };
    if (statusFilter && ["ACTIVE", "EXPIRED", "RELEASED", "REVOKED"].includes(statusFilter)) {
      whereRedemptions.status = statusFilter;
    }

    const redemptions = await prisma.couponRedemption.findMany({
      where: whereRedemptions,
      orderBy: { redeemedAt: "desc" },
      include: {
        vendor: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            status: true,
            sellerType: true,
            user: {
              select: { fullName: true, email: true, phone: true },
            },
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
      },
    });

    const activeCount = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        status: "ACTIVE",
      },
    });

    const now = new Date();
    const formattedRedemptions = await Promise.all(
      redemptions.map(async (r) => {
        const publishedCount = await prisma.product.count({
          where: { vendorId: r.vendorId, status: "PUBLISHED" },
        });

        const diffMs = new Date(r.accessExpiresAt).getTime() - now.getTime();
        const daysUntilExpiry = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        return {
          id: r.id,
          vendorId: r.vendorId,
          storeName: r.vendor.storeName,
          vendorSlug: r.vendor.slug,
          ownerName: r.vendor.user?.fullName,
          ownerEmail: r.vendor.user?.email,
          ownerPhone: r.vendor.user?.phone,
          vendorApprovalStatus: r.vendor.status,
          status: r.status,
          redeemedAt: r.redeemedAt,
          accessExpiresAt: r.accessExpiresAt,
          releasedAt: r.releasedAt,
          releaseReason: r.releaseReason,
          daysUntilExpiry,
          totalProducts: r.vendor._count.products,
          publishedProductsCount: publishedCount,
          hasPublishedProducts: publishedCount > 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      coupon: {
        ...coupon,
        activeRedemptions: activeCount,
        remainingSlots: Math.max(0, coupon.maxRedemptions - activeCount),
      },
      redemptions: formattedRedemptions,
      auditLogs: coupon.auditLogs,
    });
  } catch (err: any) {
    const isForbidden =
      err.message?.includes("Forbidden") ||
      err.message?.includes("Unauthorized") ||
      err.message?.includes("Super Administrator");
    return NextResponse.json(
      { error: err.message || "Forbidden: Super Administrator access required" },
      { status: isForbidden ? 403 : 500 }
    );
  }
}

/**
 * PATCH /api/admin/coupons/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superAdmin = await requireSuperAdmin();
    const body = await req.json();

    const parsed = updateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const currentCoupon = await prisma.coupon.findUnique({
      where: { id: params.id },
    });

    if (!currentCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const { code, maxRedemptions, freePeriodDays, inactivityDays, isActive, expiresAt } = parsed.data;

    const dataToUpdate: any = {
      updatedBy: superAdmin.id,
    };

    const auditChanges: Array<{ action: string; oldValue?: string; newValue: string }> = [];

    // 1. Code change: case-insensitive uniqueness check
    if (code !== undefined) {
      const normalized = normalizeCouponCode(code);
      if (normalized !== currentCoupon.code) {
        const existing = await prisma.coupon.findFirst({
          where: {
            code: { equals: normalized, mode: "insensitive" },
            id: { not: currentCoupon.id },
          },
        });

        if (existing) {
          return NextResponse.json(
            { error: `A coupon with code "${normalized}" already exists.` },
            { status: 400 }
          );
        }

        dataToUpdate.code = normalized;
        auditChanges.push({
          action: "UPDATE_CODE",
          oldValue: currentCoupon.code,
          newValue: normalized,
        });
      }
    }

    // 2. Cap change: validate against current active redemptions
    if (maxRedemptions !== undefined && maxRedemptions !== currentCoupon.maxRedemptions) {
      const activeCount = await prisma.couponRedemption.count({
        where: {
          couponId: currentCoupon.id,
          status: "ACTIVE",
        },
      });

      // Requirement 6: Lowering below current active count is rejected with a clear message
      if (maxRedemptions < activeCount) {
        return NextResponse.json(
          {
            error: `Cannot lower cap to ${maxRedemptions}. There are currently ${activeCount} active vendor redemptions using this coupon.`,
          },
          { status: 400 }
        );
      }

      dataToUpdate.maxRedemptions = maxRedemptions;
      auditChanges.push({
        action: "UPDATE_CAP",
        oldValue: String(currentCoupon.maxRedemptions),
        newValue: String(maxRedemptions),
      });
    }

    // 3. Free period change (applies to future redemptions only)
    if (freePeriodDays !== undefined && freePeriodDays !== currentCoupon.freePeriodDays) {
      dataToUpdate.freePeriodDays = freePeriodDays;
      auditChanges.push({
        action: "UPDATE_FREE_PERIOD",
        oldValue: `${currentCoupon.freePeriodDays} days`,
        newValue: `${freePeriodDays} days`,
      });
    }

    // 4. Inactivity window change (applies to future redemptions only)
    if (inactivityDays !== undefined && inactivityDays !== currentCoupon.inactivityDays) {
      dataToUpdate.inactivityDays = inactivityDays;
      auditChanges.push({
        action: "UPDATE_INACTIVITY_WINDOW",
        oldValue: `${currentCoupon.inactivityDays} days`,
        newValue: `${inactivityDays} days`,
      });
    }

    // 5. Active state change
    if (isActive !== undefined && isActive !== currentCoupon.isActive) {
      dataToUpdate.isActive = isActive;
      auditChanges.push({
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        oldValue: String(currentCoupon.isActive),
        newValue: String(isActive),
      });
    }

    // 6. Expiry date change
    if (expiresAt !== undefined) {
      const newExpiry = expiresAt ? new Date(expiresAt) : null;
      dataToUpdate.expiresAt = newExpiry;
      auditChanges.push({
        action: "UPDATE_EXPIRY_DATE",
        oldValue: currentCoupon.expiresAt ? currentCoupon.expiresAt.toISOString() : "none",
        newValue: newExpiry ? newExpiry.toISOString() : "none",
      });
    }

    const updatedCoupon = await prisma.$transaction(async (tx) => {
      const updated = await tx.coupon.update({
        where: { id: params.id },
        data: dataToUpdate,
      });

      // Record audit logs
      for (const change of auditChanges) {
        await tx.couponAuditLog.create({
          data: {
            couponId: updated.id,
            actorId: superAdmin.id,
            action: change.action,
            oldValue: change.oldValue || null,
            newValue: change.newValue,
          },
        });
      }

      return updated;
    });

    const activeCount = await prisma.couponRedemption.count({
      where: {
        couponId: updatedCoupon.id,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully.",
      coupon: {
        ...updatedCoupon,
        activeRedemptions: activeCount,
        remainingSlots: Math.max(0, updatedCoupon.maxRedemptions - activeCount),
      },
    });
  } catch (err: any) {
    const isForbidden =
      err.message?.includes("Forbidden") ||
      err.message?.includes("Unauthorized") ||
      err.message?.includes("Super Administrator");
    return NextResponse.json(
      { error: err.message || "Forbidden: Super Administrator access required" },
      { status: isForbidden ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/coupons/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superAdmin = await requireSuperAdmin();

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // If redemptions exist, safely deactivate to preserve audit history and active vendors
    if (coupon._count.redemptions > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.coupon.update({
          where: { id: params.id },
          data: { isActive: false, updatedBy: superAdmin.id },
        });

        await tx.couponAuditLog.create({
          data: {
            couponId: params.id,
            actorId: superAdmin.id,
            action: "DEACTIVATE_ON_DELETE_REQUEST",
            oldValue: "true",
            newValue: "false",
            metadata: "Deactivated because historical redemptions exist.",
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Coupon has active or historical redemptions and was deactivated instead of deleted to protect vendor records.",
      });
    }

    // Otherwise, clean delete
    await prisma.coupon.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  } catch (err: any) {
    const isForbidden =
      err.message?.includes("Forbidden") ||
      err.message?.includes("Unauthorized") ||
      err.message?.includes("Super Administrator");
    return NextResponse.json(
      { error: err.message || "Forbidden: Super Administrator access required" },
      { status: isForbidden ? 403 : 500 }
    );
  }
}
