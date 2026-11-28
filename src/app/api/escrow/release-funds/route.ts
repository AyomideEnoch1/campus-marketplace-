import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendPayout, getMerchantBalance } from "@/lib/payments/flutterwave";
import { calculateEffectivePayoutEligibility } from "@/lib/escrow";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { orderId, forceAdminRelease, buyerConfirmed } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const isAdmin = (session as any)?.role === "ADMIN" || (session as any)?.role === "SUPERADMIN";

    // 1. Fetch Order and Seller Details with row-level integrity
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendor: {
          include: {
            sellerBankAccount: true,
          },
        },
        dispute: true,
        payouts: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isBuyer = Boolean(
      (session?.id && (order.buyerId === session.id || order.buyerEmail === session.email)) ||
      (session?.email && order.buyerEmail === session.email) ||
      (!order.buyerId && buyerConfirmed)
    );

    if (!isAdmin && !isBuyer && !forceAdminRelease) {
      return NextResponse.json(
        { error: "Only the buyer or an administrator can release escrow funds." },
        { status: 403 }
      );
    }

    const seller = order.vendor;

    // 2. Validate Order Status: must be confirmed or delivered
    if (order.escrow_status === "released") {
      return NextResponse.json({ message: "Funds for this order have already been released to seller", status: "released" });
    }

    if (order.escrow_status === "payout_pending") {
      return NextResponse.json({ message: "Payout is already in processing state", status: "payout_pending" });
    }

    if (order.escrow_status !== "confirmed" && order.escrow_status !== "delivered") {
      return NextResponse.json(
        { error: `Cannot release funds: order is currently in '${order.escrow_status}' state` },
        { status: 400 }
      );
    }

    // 3. Handover Verification Requirement
    if (!order.delivered_at) {
      return NextResponse.json(
        { error: "Item handover has not been verified yet. The buyer's 6-digit code must be entered before payout." },
        { status: 400 }
      );
    }

    // 4. Dispute Freeze Check
    if (order.dispute && (order.dispute.status === "open" || order.dispute.status === "under_review")) {
      return NextResponse.json(
        {
          error: "Cannot release funds: an active dispute has frozen this order.",
          disputeId: order.dispute.id,
          disputeStatus: order.dispute.status,
        },
        { status: 400 }
      );
    }

    // 5. Seller Strike and Fraud Hold Check
    if (seller.strikesCount >= 3) {
      return NextResponse.json(
        { error: "Seller account has 3 or more strikes. Payouts are frozen pending administrative review." },
        { status: 403 }
      );
    }

    // Check 3+ distinct buyer reports in 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentReports = await prisma.report.findMany({
      where: {
        product: { vendorId: seller.id },
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { reportedByUserId: true },
    });

    const distinctReporters = new Set(recentReports.map((r) => r.reportedByUserId).filter(Boolean));
    if (distinctReporters.size >= 3 && !isAdmin) {
      return NextResponse.json(
        {
          error: "Seller has 3 or more distinct buyer reports in the last 14 days. Payout held for fraud review.",
          heldDueToReports: true,
        },
        { status: 403 }
      );
    }

    // 6. Calculate Effective Payout Eligibility
    const eligibility = calculateEffectivePayoutEligibility(order, seller);

    // If buyer confirms satisfaction early, they waive the remaining inspection countdown
    if (!eligibility.isEligible && !isAdmin && !forceAdminRelease && !isBuyer) {
      return NextResponse.json(
        {
          error: eligibility.reason,
          eligibleAt: eligibility.eligibleDate.toISOString(),
          remainingHours: eligibility.remainingHours,
          sellerDelayHours: eligibility.sellerDelayHours,
          inspectionHours: eligibility.inspectionHours,
        },
        { status: 400 }
      );
    }

    // 7. Bank Account Verification
    const bankAccount = seller.sellerBankAccount;
    const bankCode = bankAccount?.bankCode || seller.bankCode;
    const accountNumber = bankAccount?.accountNumber || seller.bankAccountNumber;
    const isVerified = bankAccount?.verified || seller.bankVerified;

    if (!bankCode || !accountNumber || !isVerified) {
      if (isBuyer) {
        // Buyer confirmed satisfaction. Clear the order's inspection period and notify seller to provide bank info.
        await prisma.order.update({
          where: { id: order.id },
          data: { escrow_status: "payout_pending" },
        });

        const sellerAmountNotice = Number(order.seller_amount || (order.subtotal - order.commission));
        await createNotification({
          userId: seller.userId,
          type: "ESCROW_RELEASED",
          title: "Buyer Approved Your Order!",
          message: `The buyer confirmed satisfaction with Order #${order.orderNumber}! Please add your verified bank details in your wallet so ₦${sellerAmountNotice.toLocaleString()} can be disbursed.`,
          link: "/dashboard/wallet",
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: "Satisfaction confirmed! The order is approved and funds will disburse once the seller's bank details are verified.",
          status: "payout_pending",
        });
      }

      return NextResponse.json(
        { error: "Seller does not have a verified bank account on file. Payout paused until bank details are verified." },
        { status: 400 }
      );
    }

    // 8. Amount calculation & Provider Custody Balance Check
    const sellerAmount = Number(order.seller_amount || (order.subtotal - order.commission));
    if (sellerAmount <= 0) {
      return NextResponse.json({ error: "Invalid seller payout amount calculated (<= 0)" }, { status: 400 });
    }

    // Verify actual Flutterwave available merchant balance before initiating payout
    try {
      const merchantBalance = await getMerchantBalance("NGN");
      if (merchantBalance.availableBalance < sellerAmount) {
        return NextResponse.json(
          {
            error: `Payout paused: Platform available balance (₦${merchantBalance.availableBalance.toLocaleString()}) is insufficient to cover this payout (₦${sellerAmount.toLocaleString()}). Platform funding required before transfer can be completed.`,
            insufficientMerchantBalance: true,
            availableBalance: merchantBalance.availableBalance,
            requiredAmount: sellerAmount,
          },
          { status: 503 }
        );
      }
    } catch (balErr: any) {
      console.warn("[Payout Safety Notice] Could not verify merchant balance prior to transfer:", balErr.message);
    }

    // 9. Atomic Lock: Write Escrow Ledger (escrow_out) & Create Payout Record
    const payoutAttempt = (order.payouts?.length || 0) + 1;
    const reference = `payout_${order.id}_${payoutAttempt}`;

    await prisma.$transaction(async (tx) => {
      // Mark Order as payout_pending
      await tx.order.update({
        where: { id: order.id },
        data: {
          escrow_status: "payout_pending",
        },
      });

      // Write Immutable Ledger Entry: escrow_out
      await tx.escrowLedger.create({
        data: {
          orderId: order.id,
          type: "escrow_out",
          amount: sellerAmount,
          currency: "NGN",
          reference,
          description: `Payout release of NGN ${sellerAmount} for Order #${order.orderNumber} to vendor ${seller.storeName}`,
        },
      });

      // Create Payout Record
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

    // 10. Call Flutterwave Transfers API
    try {
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

        // Send In-app notification to seller
        await createNotification({
          userId: seller.userId,
          type: "ESCROW_RELEASED",
          title: isBuyer ? "Buyer Approved Payout!" : "Payout Completed",
          message: isBuyer
            ? `The buyer confirmed satisfaction with Order #${order.orderNumber}! Payout of ₦${sellerAmount.toLocaleString()} has been sent to your bank account.`
            : `Payout of ₦${sellerAmount.toLocaleString()} for Order #${order.orderNumber} has been transferred to your bank account.`,
          link: "/dashboard/wallet",
        }).catch(() => {});

        // Audit log
        await prisma.activityLog.create({
          data: {
            userId: session?.id || null,
            action: isBuyer ? "BUYER_SATISFACTION_RELEASE" : "ESCROW_PAYOUT_RELEASED",
            entityType: "ORDER",
            entityId: order.id,
            metadataJson: JSON.stringify({
              orderNumber: order.orderNumber,
              releasedBy: isBuyer ? `Buyer:${session?.id || 'guest'}` : (isAdmin ? `Admin:${session?.id}` : "System"),
              amount: sellerAmount,
            }),
          },
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: `Payout of NGN ${sellerAmount} transferred successfully to seller bank account.`,
          status: "released",
          transferId: flwTransfer.transferId,
          reference,
        });
      } else {
        // Queued / processing on Flutterwave bank network
        await prisma.payout.update({
          where: { reference },
          data: {
            status: "processing",
            flwTransferId: String(flwTransfer.transferId),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Payout of NGN ${sellerAmount} submitted to Flutterwave bank network. Status: processing.`,
          status: "payout_pending",
          transferId: flwTransfer.transferId,
          reference,
        });
      }
    } catch (flwErr: any) {
      console.error("[Flutterwave Transfer Error]:", flwErr);

      // Record failed payout attempt
      await prisma.payout.update({
        where: { reference },
        data: {
          status: "failed",
          failureReason: flwErr.message || "Transfer failed by bank network",
          nextRetryAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Retry in 2 hours
        },
      });

      if (isBuyer) {
        // Buyer has successfully confirmed satisfaction.
        // Even if Flutterwave transfer encounters a temporary gateway / IP restriction,
        // we keep escrow_status as "payout_pending" so the buyer is done,
        // and the retry queue / admin can process the payout.
        await prisma.order.update({
          where: { id: order.id },
          data: {
            escrow_status: "payout_pending",
          },
        });

        return NextResponse.json({
          success: true,
          message: "Thank you! You've confirmed satisfaction with your order. Payout has been approved and is queued for transfer to the vendor.",
          status: "payout_pending",
          queued: true,
        });
      }

      // Rollback order escrow_status so it can be retried
      await prisma.order.update({
        where: { id: order.id },
        data: {
          escrow_status: "confirmed",
        },
      });

      return NextResponse.json(
        {
          error: `Flutterwave transfer failed: ${flwErr.message}. Order status reverted to confirmed for retry.`,
          reference,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("[Release Funds Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to release funds" }, { status: 500 });
  }
}
