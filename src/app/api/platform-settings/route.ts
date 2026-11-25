import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            "enable_standard_vendor_access",
            "enable_founding_vendor_coupon",
            "enable_flutterwave_checkout",
            "require_vendor_payment",
            "vendor_access_fee",
            "vendor_access_duration_days",
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    // Check if Flutterwave checkout is unlocked.
    // If explicitly set in SiteSetting, that takes precedence.
    // Otherwise fallback to environment variable NEXT_PUBLIC_FLUTTERWAVE_LOCKED.
    const isFlutterwaveUnlocked =
      map["enable_flutterwave_checkout"] !== undefined
        ? map["enable_flutterwave_checkout"] === "true"
        : process.env.NEXT_PUBLIC_FLUTTERWAVE_LOCKED === "false";

    return NextResponse.json({
      success: true,
      enableStandardVendorAccess: map["enable_standard_vendor_access"] !== "false",
      enableFoundingVendorCoupon: map["enable_founding_vendor_coupon"] !== "false",
      enableFlutterwaveCheckout: isFlutterwaveUnlocked,
      isFlutterwaveLocked: !isFlutterwaveUnlocked,
      requireVendorPayment: map["require_vendor_payment"] !== "false",
      vendorAccessFee: Number(map["vendor_access_fee"]) || 15000,
      vendorAccessDurationDays: Number(map["vendor_access_duration_days"]) || 365,
    });
  } catch (err: any) {
    const fallbackUnlocked = process.env.NEXT_PUBLIC_FLUTTERWAVE_LOCKED === "false";
    return NextResponse.json({
      success: true,
      enableStandardVendorAccess: true,
      enableFoundingVendorCoupon: true,
      enableFlutterwaveCheckout: fallbackUnlocked,
      isFlutterwaveLocked: !fallbackUnlocked,
      requireVendorPayment: true,
      vendorAccessFee: 15000,
      vendorAccessDurationDays: 365,
    });
  }
}
