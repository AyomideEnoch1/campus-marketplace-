import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activatePaidVendorAccess } from "@/lib/coupons";
import { computeVendorEntitlements } from "@/lib/vendor-entitlements";

export const dynamic = "force-dynamic";

/**
 * Activate or renew paid vendor access (or upgrade from coupon to paid)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
      select: { id: true, accessState: true, status: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    let durationDays = Number(body.durationDays);
    if (!durationDays || durationDays <= 0) {
      const durationSetting = await prisma.siteSetting.findUnique({
        where: { key: "vendor_access_duration_days" },
      });
      durationDays = Number(durationSetting?.value) || 365;
    }

    // In production, this completes following successful payment verification / Flutterwave callback
    const result = await activatePaidVendorAccess({
      vendorId: vendor.id,
      durationDays,
    });

    const entitlements = computeVendorEntitlements(result.vendor);

    // If vendor is also approved, ensure their drafted/hidden products become published
    if (result.vendor.status === "APPROVED") {
      await prisma.product.updateMany({
        where: { vendorId: vendor.id, status: { in: ["DRAFT", "HIDDEN"] } },
        data: { status: "PUBLISHED" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Paid vendor access successfully activated! Your products and store entitlements are now live.",
      accessExpiresAt: result.accessExpiresAt,
      entitlements,
    });
  } catch (err: any) {
    console.error("[Vendor Pay Access Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process payment activation" },
      { status: err.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
