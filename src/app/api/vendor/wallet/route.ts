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
      include: {
        sellerBankAccount: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "No vendor profile found" }, { status: 404 });
    }

    // 1. Calculate Wallet Balances from database & ledger
    // A. Pending in Escrow: Orders paid_held or delivered
    const pendingOrders = await prisma.order.findMany({
      where: {
        vendorId: seller.id,
        escrow_status: { in: ["paid_held", "delivered"] },
      },
      select: { seller_amount: true, subtotal: true, commission: true },
    });

    const pendingEscrow = pendingOrders.reduce(
      (sum, o) => sum + (o.seller_amount || o.subtotal - o.commission),
      0
    );

    // B. Available for Payout: Orders confirmed
    const confirmedOrders = await prisma.order.findMany({
      where: {
        vendorId: seller.id,
        escrow_status: "confirmed",
      },
      select: { id: true, seller_amount: true, subtotal: true, commission: true },
    });

    const availablePayout = confirmedOrders.reduce(
      (sum, o) => sum + (o.seller_amount || o.subtotal - o.commission),
      0
    );

    // C. Total Paid Out: Payouts with status 'successful'
    const successfulPayouts = await prisma.payout.findMany({
      where: {
        sellerId: seller.id,
        status: "successful",
      },
      select: { amount: true },
    });

    const totalPaidOut = successfulPayouts.reduce((sum, p) => sum + p.amount, 0);

    // 2. Fetch Payout History
    const payouts = await prisma.payout.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 3. Fetch Escrow Ledger Entries for Seller's Orders
    const sellerOrders = await prisma.order.findMany({
      where: { vendorId: seller.id },
      select: { id: true },
    });
    const sellerOrderIds = sellerOrders.map((o) => o.id);

    const ledgerEntries = await prisma.escrowLedger.findMany({
      where: { orderId: { in: sellerOrderIds } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({
      success: true,
      balances: {
        pendingEscrow,
        availablePayout,
        totalPaidOut,
        eligibleOrdersCount: confirmedOrders.length,
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
