import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redeemCouponAtomic } from "@/lib/coupons";
import { computeVendorEntitlements } from "@/lib/vendor-entitlements";

export const dynamic = "force-dynamic";

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
    const code = body.code;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const result = await redeemCouponAtomic({
      vendorId: vendor.id,
      code,
      clientIp,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Invalid coupon code, or this coupon is currently unavailable." },
        { status: 400 }
      );
    }

    const updatedVendor = await prisma.vendorProfile.findUnique({
      where: { id: vendor.id },
      select: { accessState: true, status: true, accessExpiresAt: true },
    });

    const entitlements = updatedVendor ? computeVendorEntitlements(updatedVendor) : null;

    return NextResponse.json({
      success: true,
      message: "Founding vendor coupon successfully activated! You now have full access to your vendor store.",
      accessExpiresAt: result.accessExpiresAt,
      entitlements,
    });
  } catch (err: any) {
    console.error("[Redeem Coupon API Error]:", err);
    return NextResponse.json(
      { error: err.message || "Unable to redeem coupon at this time." },
      { status: err.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
