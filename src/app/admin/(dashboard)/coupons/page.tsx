import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminCouponsClient } from "./AdminCouponsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founding Vendor Coupons & Access Control | Super Admin | ọjà",
  description: "Manage vendor founding coupons, active redemption caps, access windows, and redemptions audit log.",
};

export default async function AdminCouponsPage() {
  const session = await getSession();

  // Strict Server-Side Super Admin Enforcement:
  // Regular admins, vendors, and customers get 403 / redirect
  if (!session || session.role !== "SUPERADMIN") {
    redirect("/admin");
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          redemptions: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          actor: {
            select: { fullName: true, email: true },
          },
        },
      },
    },
  });

  const couponsWithUsage = await Promise.all(
    coupons.map(async (c) => {
      const activeCount = await prisma.couponRedemption.count({
        where: {
          couponId: c.id,
          status: "ACTIVE",
        },
      });

      return {
        id: c.id,
        code: c.code,
        type: c.type,
        maxRedemptions: c.maxRedemptions,
        activeRedemptions: activeCount,
        remainingSlots: Math.max(0, c.maxRedemptions - activeCount),
        freePeriodDays: c.freePeriodDays,
        inactivityDays: c.inactivityDays,
        isActive: c.isActive,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        totalRedemptions: c._count.redemptions,
        auditLogs: c.auditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          oldValue: log.oldValue,
          newValue: log.newValue,
          metadata: log.metadata,
          actorName: log.actor?.fullName || "Super Admin",
          actorEmail: log.actor?.email,
          createdAt: log.createdAt.toISOString(),
        })),
      };
    })
  );

  const settings = await prisma.siteSetting.findMany({
    where: {
      key: { in: ["vendor_access_fee", "vendor_access_duration_days"] },
    },
  });

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const vendorAccessFee = Number(settingsMap["vendor_access_fee"]) || 15000;
  const vendorAccessDurationDays = Number(settingsMap["vendor_access_duration_days"]) || 365;

  return (
    <AdminCouponsClient
      initialCoupons={couponsWithUsage}
      initialVendorAccessFee={vendorAccessFee}
      initialVendorAccessDurationDays={vendorAccessDurationDays}
    />
  );
}
