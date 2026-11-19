import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendPayout } from "@/lib/payments/flutterwave";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { orderId, forceAdminRelease } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const isAdmin = (session as any)?.role === "ADMIN";

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

    const seller = order.vendor;

    // 2. Validate Order Status: must be confirmed (or delivered)
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

    // 3. Dispute Freeze Check
    if (order.dispute && (order.dispute.status === "open" || order.dispute.status === "under_review")) {
      return NextResponse.json(
        { error: "Cannot release funds: an active dispute has frozen this order.", disputeId: order.dispute.id },
        { status: 400 }
      );
    }

    // 4. Seller Strike and Report Hold Check
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

    // 5. Payout Delay Evaluation (unless overridden by Admin)
    const confirmedTime = order.confirmed_at || order.delivered_at || order.createdAt;
    let delayHours = seller.payoutDelayHours || (seller.sellerType === "guest" ? 72 : 48);

    if (seller.isTrustedSeller) {
      delayHours = Math.min(delayHours, 24);
    }

    const releaseEligibleTime = new Date(new Date(confirmedTime).getTime() + delayHours * 60 * 60 * 1000);
    const now = new Date();

    if (now < releaseEligibleTime && !isAdmin && !forceAdminRelease) {
      const remainingHours = Math.ceil((releaseEligibleTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      return NextResponse.json(
        {
          error: `Payout hold in effect. Funds will be eligible for transfer in ${remainingHours} hour(s).`,
          eligibleAt: releaseEligibleTime.toISOString(),
          delayHours,
          remainingHours,
        },
        { status: 400 }
      );
    }

    // 6. Bank Account Verification
    const bankAccount = seller.sellerBankAccount;
    const bankCode = bankAccount?.bankCode || seller.bankCode;
    const accountNumber = bankAccount?.accountNumber || seller.bankAccountNumber;
    const isVerified = bankAccount?.verified || seller.bankVerified;

    if (!bankCode || !accountNumber || !isVerified) {
      return NextResponse.json(
        { error: "Seller does not have a verified bank account on file. Payout paused until bank details are verified." },
        { status: 400 }
      );
    }

    // 7. Atomic Lock: Write Escrow Ledger (escrow_out) & Create Payout Record
    const payoutAttempt = (order.payouts?.length || 0) + 1;
    const reference = `payout_${order.id}_${payoutAttempt}`;
    const sellerAmount = Number(order.seller_amount || order.subtotal - order.commission);

    await prisma.$transaction(async (tx) => {
      // Mark Order as payout_pending
      await tx.order.update({
        where: { id: order.id },
        data: {
          escrow_status: "payout_pending",
        },
      });

      // Write Append-Only Ledger Entry: escrow_out
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

    // 8. Call Flutterwave Transfers API
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
        // Immediate success
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

        return NextResponse.json({
          success: true,
          message: `Payout of NGN ${sellerAmount} transferred successfully to seller bank account.`,
          status: "released",
          transferId: flwTransfer.transferId,
          reference,
        });
      } else {
        // Queued / processing
        await prisma.payout.update({
          where: { reference },
          data: {
            status: "processing",
            flwTransferId: String(flwTransfer.transferId),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Payout initiated and processing via Flutterwave Transfers. Awaiting bank completion.`,
          status: "payout_pending",
          transferId: flwTransfer.transferId,
          reference,
        });
      }
    } catch (transferErr: any) {
      console.error("[Flutterwave Transfer Error]:", transferErr);

      // Record transfer failure with retry schedule
      const nextRetry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour retry
      await prisma.payout.update({
        where: { reference },
        data: {
          status: "failed",
          failureReason: transferErr.message || "Transfer failed via Flutterwave",
          nextRetryAt: nextRetry,
        },
      });

      return NextResponse.json(
        {
          error: `Payout transfer failed: ${transferErr.message}. Scheduled for retry.`,
          status: "failed",
          reference,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("[Release Funds Fatal Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to release funds" }, { status: 500 });
  }
}
