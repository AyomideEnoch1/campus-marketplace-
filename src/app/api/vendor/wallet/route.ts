import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await prisma.vendorProfile.findFirst({
      where: {
        OR: [
          { userId: session.id },
          { user: { email: session.email } },
        ],
      },
      select: {
        id: true,
        storeName: true,
        sellerType: true,
        isTrustedSeller: true,
        payoutDelayHours: true,
        strikesCount: true,
        bankCode: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountName: true,
        bankResolvedName: true,
        bankVerified: true,
        sellerBankAccount: {
          select: {
            bankCode: true,
            bankName: true,
            accountNumber: true,
            accountName: true,
            verified: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "No vendor profile found" }, { status: 404 });
    }

    // 1. Calculate Wallet Balances from database via SQL aggregates
    const [pendingAgg, confirmedAgg, payoutAgg] = await Promise.all([
      prisma.order.aggregate({
        where: {
          vendorId: seller.id,
          escrow_status: { in: ["paid_held", "delivered"] },
        },
        _sum: { seller_amount: true, subtotal: true, commission: true },
      }),
      prisma.order.aggregate({
        where: {
          vendorId: seller.id,
          escrow_status: "confirmed",
        },
        _sum: { seller_amount: true, subtotal: true, commission: true },
        _count: { _all: true },
      }),
      prisma.payout.aggregate({
        where: {
          sellerId: seller.id,
          status: "successful",
        },
        _sum: { amount: true },
      }),
    ]);

    const pendingEscrow = Number(
      pendingAgg._sum.seller_amount ??
        Math.max(
          0,
          Number(pendingAgg._sum.subtotal ?? 0) -
            Number(pendingAgg._sum.commission ?? 0)
        )
    );

    const availablePayout = Number(
      confirmedAgg._sum.seller_amount ??
        Math.max(
          0,
          Number(confirmedAgg._sum.subtotal ?? 0) -
            Number(confirmedAgg._sum.commission ?? 0)
        )
    );

    const totalPaidOut = Number(payoutAgg._sum.amount ?? 0);

    // 2. Fetch Payout History (explicit columns, bounded)
    const payouts = await prisma.payout.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        status: true,
        reference: true,
        failureReason: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // 3. Fetch Escrow Ledger Entries for Seller's Orders via relation filter
    const ledgerEntries = await prisma.escrowLedger.findMany({
      where: { order: { vendorId: seller.id } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        orderId: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      balances: {
        pendingEscrow,
        availablePayout,
        totalPaidOut,
        eligibleOrdersCount: confirmedAgg._count._all,
      },
      bankAccount: seller.sellerBankAccount || {
        bankCode: seller.bankCode,
        bankName: seller.bankName,
        accountNumber: seller.bankAccountNumber,
        accountName: seller.bankAccountName || seller.bankResolvedName,
        verified: seller.bankVerified,
      },
      payouts,
      ledgerEntries,
      vendorMeta: {
        storeName: seller.storeName,
        sellerType: seller.sellerType,
        isTrustedSeller: seller.isTrustedSeller,
        payoutDelayHours: seller.payoutDelayHours,
        strikesCount: seller.strikesCount,
      },
    });
  } catch (error: any) {
    console.error("[Get Vendor Wallet Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch wallet details" }, { status: 500 });
  }
}
