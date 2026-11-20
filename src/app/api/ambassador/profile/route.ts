import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ambassador = await prisma.ambassadorProfile.findUnique({
      where: { userId: session.id },
      include: {
        campus: {
          select: { id: true, name: true, slug: true, city: true },
        },
        _count: {
          select: {
            referrals: true,
          },
        },
      },
    });

    if (!ambassador) {
      return NextResponse.json({ ambassador: null });
    }

    // Get breakdown stats
    const [totalVendors, qualifiedVendors, totalBuyers] = await Promise.all([
      prisma.referral.count({
        where: { ambassadorId: ambassador.id, roleAtSignup: "VENDOR" },
      }),
      prisma.referral.count({
        where: { ambassadorId: ambassador.id, roleAtSignup: "VENDOR", isQualified: true },
      }),
      prisma.referral.count({
        where: { ambassadorId: ambassador.id, roleAtSignup: "BUYER" },
      }),
    ]);

    return NextResponse.json({
      ambassador: {
        ...ambassador,
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
      },
    });
  } catch (err: any) {
    console.error("GET /api/ambassador/profile error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bankCode,
      bankName,
      accountNumber,
      accountName,
      whatsapp,
      bio,
    } = body;

    const ambassador = await prisma.ambassadorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!ambassador) {
      return NextResponse.json({ error: "Ambassador profile not found" }, { status: 404 });
    }

    const updated = await prisma.ambassadorProfile.update({
      where: { id: ambassador.id },
      data: {
        bankCode: bankCode ?? ambassador.bankCode,
        bankName: bankName ?? ambassador.bankName,
        bankAccountNumber: accountNumber ?? ambassador.bankAccountNumber,
        bankAccountName: accountName ?? ambassador.bankAccountName,
        bankResolvedName: accountName ?? ambassador.bankResolvedName,
        bankVerified: Boolean(bankCode && accountNumber && accountName),
        whatsapp: whatsapp ?? ambassador.whatsapp,
        bio: bio ?? ambassador.bio,
      },
    });

    return NextResponse.json({ success: true, ambassador: updated });
  } catch (err: any) {
    console.error("PUT /api/ambassador/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
