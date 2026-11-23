import { NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeVendorEntitlements } from "@/lib/vendor-entitlements";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
      include: {
        couponRedemptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            coupon: {
              select: { code: true, freePeriodDays: true },
            },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const entitlements = computeVendorEntitlements(vendor);
    const latestRedemption = vendor.couponRedemptions?.[0] || null;

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        storeName: vendor.storeName,
        status: vendor.status,
        accessState: vendor.accessState,
        accessExpiresAt: vendor.accessExpiresAt,
        accessActivatedAt: vendor.accessActivatedAt,
        accessPaidAt: vendor.accessPaidAt,
        approvedAt: vendor.approvedAt,
      },
      entitlements,
      latestRedemption: latestRedemption
        ? {
            code: latestRedemption.coupon.code,
            status: latestRedemption.status,
            redeemedAt: latestRedemption.redeemedAt,
            accessExpiresAt: latestRedemption.accessExpiresAt,
            releasedAt: latestRedemption.releasedAt,
            releaseReason: latestRedemption.releaseReason,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve access status" },
      { status: err.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
