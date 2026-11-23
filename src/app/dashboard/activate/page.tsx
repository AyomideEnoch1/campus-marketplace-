import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeVendorEntitlements } from "@/lib/vendor-entitlements";
import { VendorActivateClient } from "./VendorActivateClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activate Vendor Access | Founding Vendor Coupon & Plans | ọjà",
  description: "Activate your campus vendor access with a Founding Vendor Coupon or subscription.",
};

export default async function VendorActivatePage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?redirect=/dashboard/activate");
  }

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
    include: {
      campus: true,
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
    redirect("/vendor/register");
  }

  const entitlements = computeVendorEntitlements(vendor);
  const latestRedemption = vendor.couponRedemptions?.[0] || null;

  return (
    <VendorActivateClient
      vendor={{
        id: vendor.id,
        storeName: vendor.storeName,
        status: vendor.status,
        accessState: vendor.accessState,
        accessExpiresAt: vendor.accessExpiresAt ? vendor.accessExpiresAt.toISOString() : null,
        approvedAt: vendor.approvedAt ? vendor.approvedAt.toISOString() : null,
      }}
      entitlements={entitlements}
      latestRedemption={
        latestRedemption
          ? {
              code: latestRedemption.coupon.code,
              status: latestRedemption.status,
              redeemedAt: latestRedemption.redeemedAt.toISOString(),
              accessExpiresAt: latestRedemption.accessExpiresAt.toISOString(),
              releasedAt: latestRedemption.releasedAt ? latestRedemption.releasedAt.toISOString() : null,
              releaseReason: latestRedemption.releaseReason,
            }
          : null
      }
    />
  );
}
