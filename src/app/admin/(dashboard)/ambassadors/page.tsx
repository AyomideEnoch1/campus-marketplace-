export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCachedCampuses } from "@/lib/db/queries";
import {
  getReferralRewardConfig,
  getAmbassadorPayoutLockStatus,
  getAmbassadorDashboardBanner,
} from "@/lib/referral";
import { AdminAmbassadorTable } from "./AdminAmbassadorTable";

export default async function AdminAmbassadorsPage() {
  const [session, ambassadors, campuses, rewardConfig, payoutRequestsLocked, bannerConfig] =
    await Promise.all([
      getSession(),
      prisma.ambassadorProfile.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          userId: true,
          referralCode: true,
          status: true,
          campusId: true,
          totalClicks: true,
          pendingEarnings: true,
          paidEarnings: true,
          totalEarnings: true,
          bankAccountName: true,
          bankAccountNumber: true,
          bankName: true,
          bankVerified: true,
          createdAt: true,
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          campus: { select: { id: true, name: true, city: true } },
          _count: { select: { referrals: true, payouts: true } },
          referrals: {
            select: {
              id: true,
              roleAtSignup: true,
              isQualified: true,
              rewardAmount: true,
              rewardStatus: true,
            },
          },
        },
      }),
      getCachedCampuses(),
      getReferralRewardConfig(),
      getAmbassadorPayoutLockStatus(),
      getAmbassadorDashboardBanner(),
    ]);

  const formatted = ambassadors.map((a) => {
    const vendorCount = a.referrals.filter((r) => r.roleAtSignup === "VENDOR").length;
    const qualifiedVendors = a.referrals.filter((r) => r.roleAtSignup === "VENDOR" && r.isQualified).length;
    const buyerCount = a.referrals.filter((r) => r.roleAtSignup === "BUYER").length;

    return {
      id: a.id,
      userId: a.userId,
      fullName: a.user.fullName,
      email: a.user.email,
      phone: a.user.phone,
      referralCode: a.referralCode,
      status: a.status,
      campusName: a.campus.name,
      campusId: a.campusId,
      totalClicks: a.totalClicks,
      totalReferrals: a._count.referrals,
      vendorCount,
      qualifiedVendors,
      buyerCount,
      pendingEarnings: a.pendingEarnings,
      paidEarnings: a.paidEarnings,
      totalEarnings: a.totalEarnings,
      bankAccountName: a.bankAccountName,
      bankAccountNumber: a.bankAccountNumber,
      bankName: a.bankName,
      bankVerified: a.bankVerified,
      createdAt: a.createdAt.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Ambassadors & Referral Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Monitor student representatives advocating across Nigerian universities. Track vendor recruitment, clicks, and management commission payouts.
          </p>
        </div>
      </div>

      <AdminAmbassadorTable
        initialAmbassadors={formatted}
        campuses={campuses}
        initialRewardConfig={rewardConfig}
        initialPayoutRequestsLocked={payoutRequestsLocked}
        initialBannerConfig={bannerConfig}
        currentAdminRole={session?.role}
      />
    </div>
  );
}
