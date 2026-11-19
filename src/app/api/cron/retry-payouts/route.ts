import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransferStatus, sendPayout } from "@/lib/payments/flutterwave";

export const dynamic = "force-dynamic";

/**
 * Scheduled job to retry failed or stuck payouts.
 * Can be triggered via Vercel Cron, pg_cron, or manual Admin button.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Optional bearer token check if CRON_SECRET is set
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron caller" }, { status: 401 });
    }

    const now = new Date();

    // 1. Fetch eligible failed payouts that haven't exceeded maximum attempts (5)
    const eligiblePayouts = await prisma.payout.findMany({
      where: {
        status: "failed",
        attempts: { lt: 5 },
        OR: [
          { nextRetryAt: { lte: now } },
          { nextRetryAt: null },
        ],
      },
      include: {
        order: true,
        seller: {
          include: {
            sellerBankAccount: true,
          },
        },
      },
      take: 20,
    });

    const results: any[] = [];

    for (const payout of eligiblePayouts) {
      const seller = payout.seller;
      const bankAccount = seller.sellerBankAccount;
      const bankCode = bankAccount?.bankCode || seller.bankCode;
      const accountNumber = bankAccount?.accountNumber || seller.bankAccountNumber;

      if (!bankCode || !accountNumber) {
        results.push({
          payoutId: payout.id,
          reference: payout.reference,
          status: "skipped",
          reason: "No valid bank account",
        });
        continue;
      }

      // Check current transfer status on Flutterwave before re-attempting
      try {
        if (payout.flwTransferId) {
          const checkStatus = await getTransferStatus(payout.flwTransferId);
          if (checkStatus.status === "successful") {
            const completeTime = new Date();
            await prisma.$transaction([
              prisma.payout.update({
                where: { id: payout.id },
                data: {
                  status: "successful",
                  completedAt: completeTime,
                },
              }),
              prisma.order.update({
                where: { id: payout.orderId },
                data: {
                  escrow_status: "released",
                  released_at: completeTime,
                },
              }),
            ]);
            results.push({
              payoutId: payout.id,
              reference: payout.reference,
              status: "already_successful_reconciled",
            });
            continue;
          }
        }
      } catch {
        // Fallback: Proceed with retry
      }

      // Increment attempt counter & generate unique retry reference
      const nextAttempt = payout.attempts + 1;
      const retryReference = `${payout.reference}_r${nextAttempt}`;

      try {
        const transferRes = await sendPayout(
          {
            bankCode,
            accountNumber,
            accountName: bankAccount?.accountName || seller.bankAccountName || undefined,
          },
          payout.amount,
          retryReference
        );

        const isSuccess = transferRes.status === "successful";

        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: isSuccess ? "successful" : "processing",
            flwTransferId: String(transferRes.transferId),
            attempts: nextAttempt,
            completedAt: isSuccess ? new Date() : null,
          },
        });

        if (isSuccess) {
          await prisma.order.update({
            where: { id: payout.orderId },
            data: {
              escrow_status: "released",
              released_at: new Date(),
            },
          });
        }

        results.push({
          payoutId: payout.id,
          reference: retryReference,
          status: isSuccess ? "successful" : "processing",
        });
      } catch (err: any) {
        const nextRetryDelayHours = Math.min(24, Math.pow(2, nextAttempt));
        const nextRetryAt = new Date(Date.now() + nextRetryDelayHours * 60 * 60 * 1000);

        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            attempts: nextAttempt,
            failureReason: err.message || "Retry transfer failed",
            nextRetryAt: nextAttempt < 5 ? nextRetryAt : null,
          },
        });

        results.push({
          payoutId: payout.id,
          reference: retryReference,
          status: "failed",
          attempt: nextAttempt,
          nextRetryAt,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
    });
  } catch (error: any) {
    console.error("[Retry Payouts Error]:", error);
    return NextResponse.json({ error: error.message || "Retry payouts failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
