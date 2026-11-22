export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getAmbassadorPayoutLockStatus } from "@/lib/referral";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ambassador = await prisma.ambassadorProfile.findUnique({
      where: { userId: session.id },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    if (!ambassador) {
      return NextResponse.json({ error: "Ambassador profile not found" }, { status: 404 });
    }

    if (ambassador.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your ambassador account is not active. Please contact support." },
        { status: 403 }
      );
    }

    // 1. Super Admin lock enforcement
    const isLocked = await getAmbassadorPayoutLockStatus();
    if (isLocked) {
      return NextResponse.json(
        { error: "Earnings payout requests are currently paused by platform administrators. Please check back later." },
        { status: 403 }
      );
    }

    // 2. Bank verification check
    if (!ambassador.bankVerified || !ambassador.bankAccountNumber || !ambassador.bankName) {
      return NextResponse.json(
        { error: "Please link and verify your Nigerian bank account before requesting your earnings." },
        { status: 400 }
      );
    }

    // 3. Pending earnings check
    if (ambassador.pendingEarnings <= 0) {
      return NextResponse.json(
        { error: "You do not have any pending earnings available for payout at this time." },
        { status: 400 }
      );
    }

    // 4. Check for existing pending payout request
    const existingPending = await prisma.ambassadorPayout.findFirst({
      where: {
        ambassadorId: ambassador.id,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          error: `You already have an active payout request of ₦${existingPending.amount.toLocaleString()} currently under administrative review.`,
        },
        { status: 400 }
      );
    }

    // 5. Parse request body (optional custom amount)
    let requestedAmount = ambassador.pendingEarnings;
    let notes = "Requested by ambassador via dashboard";

    try {
      const body = await request.json();
      if (body?.amount && !isNaN(Number(body.amount))) {
        const parsedAmount = Number(body.amount);
        if (parsedAmount > 0) {
          requestedAmount = Math.min(parsedAmount, ambassador.pendingEarnings);
        }
      }
      if (body?.notes && typeof body.notes === "string") {
        notes = body.notes.trim().slice(0, 200);
      }
    } catch {
      // Body is optional
    }

    if (requestedAmount <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });
    }

    const reference = `AMB-REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const bankDetailsSnapshot = JSON.stringify({
      bankName: ambassador.bankName,
      accountNumber: ambassador.bankAccountNumber,
      accountName: ambassador.bankAccountName || ambassador.user.fullName,
    });

    const payout = await prisma.ambassadorPayout.create({
      data: {
        ambassadorId: ambassador.id,
        amount: requestedAmount,
        reference,
        status: "PENDING",
        bankDetails: bankDetailsSnapshot,
        notes,
        createdAt: new Date(),
      },
    });

    // In-app notification to the ambassador
    await prisma.notification.create({
      data: {
        userId: session.id,
        type: "SYSTEM",
        title: "Earnings Payout Requested",
        message: `Your payout request for ₦${requestedAmount.toLocaleString()} has been submitted. Management will review and disburse into your verified ${ambassador.bankName} account.`,
      },
    });

    // Activity log audit trail
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: "AMBASSADOR_PAYOUT_REQUESTED",
        entityType: "AmbassadorPayout",
        entityId: payout.id,
        metadataJson: JSON.stringify({
          amount: requestedAmount,
          reference,
          bankName: ambassador.bankName,
          accountNumber: ambassador.bankAccountNumber,
          accountName: ambassador.bankAccountName || ambassador.user.fullName,
          ambassadorEmail: ambassador.user.email,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Your payout request for ₦${requestedAmount.toLocaleString()} has been submitted successfully!`,
      payout,
    });
  } catch (err: any) {
    console.error("POST /api/ambassador/payout-request error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit payout request" },
      { status: 500 }
    );
  }
}
