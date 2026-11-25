import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getMerchantBalance } from "@/lib/payments/flutterwave";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || ((session as any).role !== "ADMIN" && (session as any).role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    // 1. Escrow Ledger Metrics
    const [escrowIn, escrowOut, refundsOut, commission] = await Promise.all([
      prisma.escrowLedger.aggregate({ where: { type: "escrow_in" }, _sum: { amount: true } }),
      prisma.escrowLedger.aggregate({ where: { type: "escrow_out" }, _sum: { amount: true } }),
      prisma.escrowLedger.aggregate({ where: { type: "refund_out" }, _sum: { amount: true } }),
      prisma.escrowLedger.aggregate({ where: { type: "commission" }, _sum: { amount: true } }),
    ]);

    const totalEscrowIn = escrowIn._sum.amount || 0;
    const totalEscrowOut = escrowOut._sum.amount || 0;
    const totalRefundsOut = refundsOut._sum.amount || 0;
    const totalCommission = commission._sum.amount || 0;
    const activeEscrowHeld = Math.max(0, totalEscrowIn - totalEscrowOut - totalRefundsOut);

    // 2. Flutterwave Merchant Balance
    const merchantBalance = await getMerchantBalance("NGN");
    const isLowBalanceWarning = merchantBalance.availableBalance < activeEscrowHeld;
    const deficitAmount = isLowBalanceWarning ? activeEscrowHeld - merchantBalance.availableBalance : 0;

    // 3. Failed Payouts Queue
    const failedPayouts = await prisma.payout.findMany({
      where: { status: { in: ["failed", "reversed"] } },
      include: {
        order: {
          select: { orderNumber: true, totalAmount: true },
        },
        seller: {
          select: { storeName: true, bankAccountNumber: true, bankName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 4. Active Disputes (bounded, explicit select)
    const disputes = await prisma.dispute.findMany({
      where: { status: { in: ["open", "under_review"] } },
      take: 30,
      select: {
        id: true,
        orderId: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            escrow_status: true,
            vendor: {
              select: { id: true, storeName: true },
            },
          },
        },
        buyer: {
          select: { fullName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 5. Recent Escrow Orders
    const recentOrders = await prisma.order.findMany({
      where: {
        escrow_status: { not: "pending" },
      },
      select: {
        id: true,
        orderNumber: true,
        buyerName: true,
        totalAmount: true,
        seller_amount: true,
        commission: true,
        escrow_status: true,
        delivered_at: true,
        confirmed_at: true,
        released_at: true,
        createdAt: true,
        vendor: { select: { storeName: true } },
        payments: {
          take: 2,
          select: { id: true, status: true, amount: true, flwTransactionId: true, txRef: true },
        },
        payouts: {
          take: 2,
          select: { id: true, status: true, amount: true, reference: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    // 6. Webhook Events Log
    const webhookLogs = await prisma.webhookEvent.findMany({
      orderBy: { processedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalEscrowIn,
        totalEscrowOut,
        totalRefundsOut,
        totalCommission,
        activeEscrowHeld,
        flwAvailableBalance: merchantBalance.availableBalance,
        flwLedgerBalance: merchantBalance.ledgerBalance,
        isLowBalanceWarning,
        deficitAmount,
      },
      failedPayouts,
      disputes,
      recentOrders,
      webhookLogs,
    });
  } catch (error: any) {
    console.error("[Admin Escrow Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load admin escrow data" }, { status: 500 });
  }
}
