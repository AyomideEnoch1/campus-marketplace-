import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getReferralRewardConfig,
  getAmbassadorPayoutLockStatus,
  getAmbassadorDashboardBanner,
} from "@/lib/referral";
import { AmbassadorDashboardClient } from "./AmbassadorDashboardClient";
import { AmbassadorOnboarding } from "./AmbassadorOnboarding";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ambassador Hub | ọjà",
  description: "Track your campus referrals, view QR code flyer, monitor earnings, and manage bank payouts.",
};

export default async function AmbassadorPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?redirect=/ambassador");
  }

  // Fetch campuses for onboarding/context
  const campuses = await prisma.campus.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  // Check if current user has an ambassador profile
  const ambassador = await prisma.ambassadorProfile.findUnique({
    where: { userId: session.id },
    include: {
      campus: {
        select: { id: true, name: true, city: true },
      },
      _count: {
        select: { referrals: true },
      },
    },
  });

  if (!ambassador) {
    return <AmbassadorOnboarding campuses={campuses} userName={session.fullName} />;
  }

  // Compute stats, active pending requests, lock status, and announcement banner
  const [
    totalVendors,
    qualifiedVendors,
    totalBuyers,
    rewardConfig,
    payoutRequestsLocked,
    activePayoutRequest,
    bannerConfig,
  ] = await Promise.all([
    prisma.referral.count({
      where: { ambassadorId: ambassador.id, roleAtSignup: "VENDOR" },
    }),
    prisma.referral.count({
      where: { ambassadorId: ambassador.id, roleAtSignup: "VENDOR", isQualified: true },
    }),
    prisma.referral.count({
      where: { ambassadorId: ambassador.id, roleAtSignup: "BUYER" },
    }),
    getReferralRewardConfig(),
    getAmbassadorPayoutLockStatus(),
    prisma.ambassadorPayout.findFirst({
      where: { ambassadorId: ambassador.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    getAmbassadorDashboardBanner(),
  ]);

  const sanitizedAmbassador = {
    id: ambassador.id,
    referralCode: ambassador.referralCode,
    status: ambassador.status,
    whatsapp: ambassador.whatsapp,
    bio: ambassador.bio,
    bankAccountName: ambassador.bankAccountName,
    bankAccountNumber: ambassador.bankAccountNumber,
    bankCode: ambassador.bankCode,
    bankName: ambassador.bankName,
    bankVerified: ambassador.bankVerified,
    campus: ambassador.campus,
    payoutRequestsLocked,
    bannerConfig,
    activePayoutRequest: activePayoutRequest
      ? {
          id: activePayoutRequest.id,
          amount: activePayoutRequest.amount,
          reference: activePayoutRequest.reference,
          status: activePayoutRequest.status,
          createdAt: activePayoutRequest.createdAt.toISOString(),
        }
      : null,
    stats: {
      totalReferrals: ambassador._count.referrals,
      totalVendors,
      qualifiedVendors,
      totalBuyers,
      totalClicks: ambassador.totalClicks,
      totalEarnings: ambassador.totalEarnings,
      pendingEarnings: ambassador.pendingEarnings,
      paidEarnings: ambassador.paidEarnings,
    },
  };

  return (
    <AmbassadorDashboardClient
      initialAmbassador={sanitizedAmbassador as any}
      rewardConfig={rewardConfig}
    />
  );
}
