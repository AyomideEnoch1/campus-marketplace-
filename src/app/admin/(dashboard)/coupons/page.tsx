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

  // Server-Side Role Enforcement: Admin / Super Admin access required
  if (!session || (session.role !== "SUPERADMIN" && session.role !== "ADMIN")) {
    redirect("/admin");
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
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

  const couponIds = coupons.map((c) => c.id);
  const activeCounts = couponIds.length
    ? await prisma.couponRedemption.groupBy({
        by: ["couponId"],
        where: {
          couponId: { in: couponIds },
          status: "ACTIVE",
        },
        _count: { _all: true },
      })
    : [];
  const activeCountMap = new Map(activeCounts.map((row) => [row.couponId, row._count._all]));

  const couponsWithUsage = coupons.map((c) => {
    const activeCount = activeCountMap.get(c.id) ?? 0;

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
  });

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
