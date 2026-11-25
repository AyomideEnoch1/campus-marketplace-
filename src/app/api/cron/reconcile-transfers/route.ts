import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransferStatus, getMerchantBalance } from "@/lib/payments/flutterwave";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!cronSecret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron caller" }, { status: 401 });
    }

    // 1. Fetch stuck 'processing' or 'pending' payouts created more than 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const stuckPayouts = await prisma.payout.findMany({
      where: {
        status: { in: ["processing", "pending"] },
        createdAt: { lte: thirtyMinutesAgo },
      },
      select: {
        id: true,
        orderId: true,
        reference: true,
        flwTransferId: true,
        status: true,
        amount: true,
      },
      take: 50,
    });

    const reconciledPayouts: any[] = [];

    for (const payout of stuckPayouts) {
      const identifier = payout.flwTransferId || payout.reference;
      if (!identifier) continue;

      try {
        const transferRes = await getTransferStatus(identifier);
        const status = transferRes.status.toLowerCase();

        if (status === "successful") {
          const now = new Date();
          await prisma.$transaction([
            prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: "successful",
                completedAt: now,
              },
            }),
            prisma.order.update({
              where: { id: payout.orderId },
              data: {
                escrow_status: "released",
                released_at: now,
              },
            }),
          ]);

          reconciledPayouts.push({
            payoutId: payout.id,
            reference: payout.reference,
            oldStatus: payout.status,
            newStatus: "successful",
          });
        } else if (status === "failed") {
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              status: "failed",
              failureReason: transferRes.failureReason || "Failed upon reconciliation inquiry",
              nextRetryAt: new Date(Date.now() + 60 * 60 * 1000),
            },
          });

          reconciledPayouts.push({
            payoutId: payout.id,
            reference: payout.reference,
            oldStatus: payout.status,
            newStatus: "failed",
          });
        } else if (status === "reversed") {
          await prisma.$transaction([
            prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: "reversed",
                failureReason: "Reversed by Flutterwave recipient bank",
              },
            }),
            prisma.escrowLedger.create({
              data: {
                orderId: payout.orderId,
                type: "adjustment",
                amount: payout.amount,
                currency: "NGN",
                reference: `${payout.reference}_rev_reconcile`,
                description: `Automatic reconciliation reversal adjustment for payout ${payout.reference}`,
              },
            }),
          ]);

          reconciledPayouts.push({
            payoutId: payout.id,
            reference: payout.reference,
            oldStatus: payout.status,
            newStatus: "reversed",
          });
        }
      } catch (err: any) {
        console.warn(`[Reconciliation Poll Warning] Payout #${payout.id}:`, err.message);
      }
    }

    // 2. Platform Escrow Balance vs Flutterwave Merchant Balance Audit
    const merchantBalance = await getMerchantBalance("NGN");

    // Aggregate ledger entries:
    // Total Escrow In
    const escrowInSum = await prisma.escrowLedger.aggregate({
      where: { type: "escrow_in" },
      _sum: { amount: true },
    });

    // Total Escrow Out (Payouts Released)
    const escrowOutSum = await prisma.escrowLedger.aggregate({
      where: { type: "escrow_out" },
      _sum: { amount: true },
    });

    // Total Refunds Out
    const refundsOutSum = await prisma.escrowLedger.aggregate({
      where: { type: "refund_out" },
      _sum: { amount: true },
    });

    const totalIn = escrowInSum._sum.amount || 0;
    const totalOut = (escrowOutSum._sum.amount || 0) + (refundsOutSum._sum.amount || 0);
    const activeEscrowHeld = Math.max(0, totalIn - totalOut);

    const isLowBalance = merchantBalance.availableBalance < activeEscrowHeld;
    const deficit = isLowBalance ? activeEscrowHeld - merchantBalance.availableBalance : 0;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stuckPayoutsChecked: stuckPayouts.length,
      reconciledPayouts,
      reconciliationAudit: {
        totalEscrowIn: totalIn,
        totalEscrowOut: totalOut,
        activeEscrowHeld,
        flwAvailableBalance: merchantBalance.availableBalance,
        flwLedgerBalance: merchantBalance.ledgerBalance,
        isLowBalanceWarning: isLowBalance,
        deficitAmount: deficit,
      },
    });
  } catch (error: any) {
    console.error("[Reconciliation Error]:", error);
    return NextResponse.json({ error: error.message || "Reconciliation failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
