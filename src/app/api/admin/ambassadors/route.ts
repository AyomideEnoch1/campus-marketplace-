export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const [ambassadors, campuses] = await Promise.all([
      prisma.ambassadorProfile.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          campus: {
            select: { id: true, name: true, city: true },
          },
          _count: {
            select: { referrals: true, payouts: true },
          },
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
      prisma.campus.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
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
        createdAt: a.createdAt,
      };
    });

    return NextResponse.json({
      ambassadors: formatted,
      campuses,
    });
  } catch (err: any) {
    console.error("GET /api/admin/ambassadors error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch ambassadors" },
      { status: err.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

// Record / Mark Ambassador Payout as Paid
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const session = await getSession();
    const body = await request.json();
    const { ambassadorId, amount, notes } = body;

    if (!ambassadorId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Ambassador ID and valid amount required" }, { status: 400 });
    }

    const ambassador = await prisma.ambassadorProfile.findUnique({
      where: { id: ambassadorId },
      include: { user: true },
    });

    if (!ambassador) {
      return NextResponse.json({ error: "Ambassador not found" }, { status: 404 });
    }

    if (!ambassador.bankAccountNumber || !ambassador.bankName) {
      return NextResponse.json(
        { error: "Ambassador has not yet configured their bank account" },
        { status: 400 }
      );
    }

    const payoutAmount = Math.min(Number(amount), ambassador.pendingEarnings);
    const reference = `AMB-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const bankDetailsSnapshot = JSON.stringify({
      bankName: ambassador.bankName,
      accountNumber: ambassador.bankAccountNumber,
      accountName: ambassador.bankAccountName || ambassador.user.fullName,
    });

    const [updatedAmbassador, payout] = await prisma.$transaction([
      prisma.ambassadorProfile.update({
        where: { id: ambassador.id },
        data: {
          pendingEarnings: { decrement: payoutAmount },
          paidEarnings: { increment: payoutAmount },
        },
      }),
      prisma.ambassadorPayout.create({
        data: {
          ambassadorId: ambassador.id,
          amount: payoutAmount,
          reference,
          status: "SUCCESSFUL",
          bankDetails: bankDetailsSnapshot,
          notes: notes || "Direct management transfer",
          processedBy: session?.id || "admin",
          processedAt: new Date(),
        },
      }),
      // Mark pending referrals as PAID
      prisma.referral.updateMany({
        where: {
          ambassadorId: ambassador.id,
          rewardStatus: "PENDING",
        },
        data: {
          rewardStatus: "PAID",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `₦${payoutAmount.toLocaleString()} payout recorded for ${ambassador.user.fullName}`,
      payout,
      ambassador: updatedAmbassador,
    });
  } catch (err: any) {
    console.error("POST /api/admin/ambassadors payout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process ambassador payout" },
      { status: 500 }
    );
  }
}
