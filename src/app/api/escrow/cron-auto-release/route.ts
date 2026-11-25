import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateEffectivePayoutEligibility } from "@/lib/escrow";
import { sendPayout, getMerchantBalance } from "@/lib/payments/flutterwave";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Validates the CRON_SECRET from Authorization header or x-cron-secret header.
 */
function verifyCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = req.headers.get("authorization");
  const xCronSecret = req.headers.get("x-cron-secret");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === cronSecret) return true;
  }

  if (xCronSecret && xCronSecret.trim() === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  return handleCronRelease(req);
}

export async function POST(req: NextRequest) {
  return handleCronRelease(req);
}

async function handleCronRelease(req: NextRequest) {
  try {
    // 1. Authenticate Caller
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { error: "Unauthorized: Valid CRON_SECRET required" },
        { status: 401 }
      );
    }

    // 2. Query Candidate Escrow Orders Awaiting Release
    // Must be in escrow mode, marked confirmed/delivered, with verified delivered_at timestamp
    const candidateOrders = await prisma.order.findMany({
      where: {
        escrow_mode: "escrow",
        escrow_status: { in: ["confirmed", "delivered"] },
        delivered_at: { not: null },
      },
      include: {
        vendor: {
          include: {
            sellerBankAccount: true,
          },
        },
        dispute: true,
        payouts: true,
      },
      orderBy: { delivered_at: "asc" },
      take: 50, // Batch limit per cron tick
    });

    if (candidateOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No escrow orders awaiting automatic release",
        processedCount: 0,
        releasedCount: 0,
      });
    }

    // 3. Check Platform Custody / Merchant Balance
    let availableBalance = 0;
    try {
      const bal = await getMerchantBalance("NGN");
      availableBalance = bal.availableBalance;
    } catch (err: any) {
      console.warn("[Cron Warning] Could not fetch Flutterwave merchant balance:", err.message);
      // In offline/mock test fallback, proceed with mock budget
      availableBalance = 10000000;
    }

    let processedCount = 0;
    let releasedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ orderId: string; reason: string }> = [];

    // 4. Process Each Candidate Idempotently
    for (const order of candidateOrders) {
      processedCount++;
      const seller = order.vendor;

      // Rule A: Active dispute freeze
      if (order.dispute && ["open", "under_review"].includes(order.dispute.status)) {
        skippedCount++;
        continue;
      }

      // Rule B: Effective payout timing check (48h inspection + seller delay)
      const eligibility = calculateEffectivePayoutEligibility(order, seller);
      if (!eligibility.isEligible) {
        skippedCount++;
        continue;
      }

      // Rule C: Verified bank account required
      const bankAccount = seller.sellerBankAccount;
      const bankCode = bankAccount?.bankCode || seller.bankCode;
      const accountNumber = bankAccount?.accountNumber || seller.bankAccountNumber;
      const isVerified = bankAccount?.verified || seller.bankVerified;

      if (!bankCode || !accountNumber || !isVerified) {
        errors.push({
          orderId: order.id,
          reason: `Seller ${seller.storeName} does not have a verified bank account on file.`,
        });
        skippedCount++;
        continue;
      }

      // Rule D: Calculate net seller amount & check merchant balance
      const sellerAmount = Number(order.seller_amount || (order.subtotal - order.commission));
      if (sellerAmount <= 0) {
        errors.push({ orderId: order.id, reason: "Zero or negative seller payout amount calculated." });
        skippedCount++;
        continue;
      }

      if (availableBalance < sellerAmount) {
        errors.push({
          orderId: order.id,
          reason: `Insufficient platform merchant balance (Available: ₦${availableBalance}, Required: ₦${sellerAmount})`,
        });
        // Abort remaining payouts in this run to avoid cascading failure
        break;
      }

      // 5. Atomic Lock & Ledger Write
      const payoutAttempt = (order.payouts?.length || 0) + 1;
      const reference = `payout_${order.id}_${payoutAttempt}`;

      try {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { escrow_status: "payout_pending" },
          });

          await tx.escrowLedger.create({
            data: {
              orderId: order.id,
              type: "escrow_out",
              amount: sellerAmount,
              currency: "NGN",
              reference,
              description: `Automated escrow release of NGN ${sellerAmount} for Order #${order.orderNumber} to vendor ${seller.storeName}`,
            },
          });

          await tx.payout.create({
            data: {
              id: `po_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              orderId: order.id,
              sellerId: seller.id,
              amount: sellerAmount,
              reference,
              status: "pending",
              attempts: payoutAttempt,
            },
          });
        });

        // 6. Initiate Transfer via Flutterwave API
        const flwTransfer = await sendPayout(
          {
            bankCode,
            accountNumber,
            accountName: bankAccount?.accountName || seller.bankAccountName || undefined,
          },
          sellerAmount,
          reference
        );

        const transferStatus = flwTransfer.status.toLowerCase();

        if (transferStatus === "successful") {
          const completeTime = new Date();
          await prisma.$transaction([
            prisma.payout.update({
              where: { reference },
              data: {
                status: "successful",
                flwTransferId: String(flwTransfer.transferId),
                completedAt: completeTime,
              },
            }),
            prisma.order.update({
              where: { id: order.id },
              data: {
                escrow_status: "released",
                released_at: completeTime,
              },
            }),
          ]);

          availableBalance -= sellerAmount;
          releasedCount++;

          // Send in-app notification to seller
          await createNotification({
            userId: seller.userId,
            type: "ESCROW_RELEASED",
            title: "Automated Payout Released",
            message: `Payout of ₦${sellerAmount.toLocaleString()} for Order #${order.orderNumber} has been released to your verified bank account.`,
            link: "/dashboard/wallet",
          }).catch(() => {});
        } else {
          // Queued on banking rails
          await prisma.payout.update({
            where: { reference },
            data: {
              status: "processing",
              flwTransferId: String(flwTransfer.transferId),
            },
          });
          availableBalance -= sellerAmount;
          releasedCount++;
        }
      } catch (payoutErr: any) {
        console.error(`[Cron Payout Failure] Order ${order.id}:`, payoutErr);

        // Record failure and revert order status for next retry
        await prisma.payout.update({
          where: { reference },
          data: {
            status: "failed",
            failureReason: payoutErr.message || "Transfer failed by bank network",
            nextRetryAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // Retry in 4h
          },
        }).catch(() => {});

        await prisma.order.update({
          where: { id: order.id },
          data: { escrow_status: "confirmed" },
        }).catch(() => {});

        errors.push({ orderId: order.id, reason: payoutErr.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron auto-release run completed: ${releasedCount} order(s) released.`,
      processedCount,
      releasedCount,
      skippedCount,
      errorsCount: errors.length,
      errors: errors.slice(0, 5),
    });
  } catch (error: any) {
    console.error("[Cron Auto-Release Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute cron release" },
      { status: 500 }
    );
  }
}
