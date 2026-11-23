import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { normalizeCouponCode } from "@/lib/coupons";

export const dynamic = "force-dynamic";

const createCouponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").max(30),
  maxRedemptions: z.number().int().min(1, "Cap must be at least 1").max(10000, "Maximum cap is 10,000").default(50),
  freePeriodDays: z.number().int().min(1, "Free period must be at least 1 day").max(3650).default(180),
  inactivityDays: z.number().int().min(1, "Inactivity window must be at least 1 day").max(365).default(60),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/admin/coupons
 * Strictly super_admin only. Returns 403 for regular admins, vendors, customers.
 */
export async function GET() {
  try {
    await requireSuperAdmin();

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    // Compute live active count per coupon
    const couponsWithUsage = await Promise.all(
      coupons.map(async (c) => {
        const activeCount = await prisma.couponRedemption.count({
          where: {
            couponId: c.id,
            status: "ACTIVE",
          },
        });

        const remainingSlots = Math.max(0, c.maxRedemptions - activeCount);

        return {
          ...c,
          activeRedemptions: activeCount,
          remainingSlots,
          totalRedemptions: c._count.redemptions,
        };
      })
    );

    return NextResponse.json({ success: true, coupons: couponsWithUsage });
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
 * POST /api/admin/coupons
 * Strictly super_admin only.
 */
export async function POST(req: NextRequest) {
  try {
    const superAdmin = await requireSuperAdmin();
    const body = await req.json();

    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid coupon configuration" },
        { status: 400 }
      );
    }

    const { code, maxRedemptions, freePeriodDays, inactivityDays, isActive, expiresAt } = parsed.data;
    const normalizedCode = normalizeCouponCode(code);

    // Verify code uniqueness case-insensitively
    const existing = await prisma.coupon.findFirst({
      where: {
        code: { equals: normalizedCode, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A coupon with code "${normalizedCode}" already exists.` },
        { status: 400 }
      );
    }

    const coupon = await prisma.$transaction(async (tx) => {
      const created = await tx.coupon.create({
        data: {
          code: normalizedCode,
          maxRedemptions,
          freePeriodDays,
          inactivityDays,
          isActive,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdBy: superAdmin.id,
          updatedBy: superAdmin.id,
        },
      });

      // Audit log creation
      await tx.couponAuditLog.create({
        data: {
          couponId: created.id,
          actorId: superAdmin.id,
          action: "CREATE",
          newValue: JSON.stringify({
            code: normalizedCode,
            maxRedemptions,
            freePeriodDays,
            inactivityDays,
            isActive,
            expiresAt,
          }),
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: `Coupon "${normalizedCode}" successfully created.`,
      coupon: {
        ...coupon,
        activeRedemptions: 0,
        remainingSlots: coupon.maxRedemptions,
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
