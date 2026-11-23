import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/coupons/[id]/redemptions/[redemptionId]/revoke
 * Strictly super_admin only. Manually revokes a specific vendor's coupon access.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; redemptionId: string } }
) {
  try {
    const superAdmin = await requireSuperAdmin();

    const redemption = await prisma.couponRedemption.findUnique({
      where: { id: params.redemptionId },
      include: {
        vendor: {
          select: { id: true, storeName: true, accessState: true },
        },
        coupon: {
          select: { id: true, code: true },
        },
      },
    });

    if (!redemption) {
      return NextResponse.json({ error: "Redemption record not found" }, { status: 404 });
    }

    if (redemption.couponId !== params.id) {
      return NextResponse.json({ error: "Redemption does not belong to this coupon" }, { status: 400 });
    }

    if (redemption.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `This redemption is already ${redemption.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Mark redemption as REVOKED
      await tx.couponRedemption.update({
        where: { id: redemption.id },
        data: {
          status: "REVOKED",
          releasedAt: now,
          releaseReason: "REVOKED",
        },
      });

      // 2. Set vendor accessState to RELEASED
      await tx.vendorProfile.update({
        where: { id: redemption.vendorId },
        data: {
          accessState: "RELEASED",
          accessExpiresAt: null,
        },
      });

      // 3. Hide vendor's products from public shop (requirement 4: hide, not delete)
      await tx.product.updateMany({
        where: {
          vendorId: redemption.vendorId,
          status: "PUBLISHED",
        },
        data: {
          status: "HIDDEN",
        },
      });

      // 4. Create Audit Log
      await tx.couponAuditLog.create({
        data: {
          couponId: redemption.couponId,
          actorId: superAdmin.id,
          action: "REVOKE_VENDOR_ACCESS",
          oldValue: `Vendor: ${redemption.vendor.storeName} (${redemption.vendorId}) - ACTIVE`,
          newValue: `Vendor: ${redemption.vendor.storeName} (${redemption.vendorId}) - REVOKED`,
          metadata: `Access revoked manually by Super Admin ${superAdmin.fullName || superAdmin.email}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Access revoked for vendor "${redemption.vendor.storeName}". Their coupon slot has reopened and published products have been hidden.`,
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
