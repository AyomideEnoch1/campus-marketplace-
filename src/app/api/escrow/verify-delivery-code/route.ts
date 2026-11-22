import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, code } = body;

    if (!orderId || !code) {
      return NextResponse.json({ error: "orderId and 6-digit code are required" }, { status: 400 });
    }

    const cleanCode = String(code).trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ error: "Code must be exactly 6 digits" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryCode: true,
        vendor: {
          select: {
            id: true,
            userId: true,
            payoutDelayHours: true,
            isTrustedSeller: true,
            sellerType: true,
            strikesCount: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify caller is the seller of the order or admin
    const isSeller = order.vendor.userId === session.id || order.vendor.userId === (session as any).userId;
    const isAdmin = (session as any).role === "ADMIN" || (session as any).role === "SUPERADMIN";

    if (!isSeller && !isAdmin) {
      return NextResponse.json({ error: "Only the seller or admin can verify the delivery code" }, { status: 403 });
    }

    // Must be paid in escrow before handover can occur
    if (!order.paid_at && order.escrow_status !== "paid_held") {
      return NextResponse.json(
        { error: "Cannot verify handover for an unpaid order. Payment must be confirmed first." },
        { status: 400 }
      );
    }

    // Prevent code reuse: if order is already marked delivered/confirmed
    if (order.delivered_at || ["confirmed", "delivered", "released"].includes(order.escrow_status)) {
      return NextResponse.json(
        {
          error: "Handover code for this order has already been verified and processed.",
          alreadyVerified: true,
          deliveredAt: order.delivered_at,
          disputeDeadline: order.dispute_deadline,
        },
        { status: 400 }
      );
    }

    const deliveryRecord = order.deliveryCode;
    if (!deliveryRecord) {
      return NextResponse.json({ error: "No delivery code found for this order" }, { status: 404 });
    }

    if (deliveryRecord.locked) {
      return NextResponse.json(
        {
          error: "Delivery code has been locked due to 5 failed attempts. Please contact platform support.",
          locked: true,
        },
        { status: 423 }
      );
    }

    if (new Date() > new Date(deliveryRecord.expiresAt)) {
      return NextResponse.json({ error: "Delivery code has expired." }, { status: 400 });
    }

    // Hash submitted code using SHA-256
    const submittedHash = crypto.createHash("sha256").update(cleanCode).digest("hex");
    const storedHash = deliveryRecord.codeHash.split("|")[0];

    // MATCH: Valid code
    if (submittedHash === storedHash) {
      const now = new Date();
      const disputeDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48-hour dispute window

      await prisma.$transaction([
        // Update Order: mark delivered, then confirmed
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "DELIVERED",
            escrow_status: "confirmed",
            delivered_at: now,
            confirmed_at: now,
            dispute_deadline: disputeDeadline,
          },
        }),
        // Reset attempts
        prisma.deliveryCode.update({
          where: { orderId: order.id },
          data: {
            attempts: 0,
          },
        }),
      ]);

      // Audit Log
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          action: "HANDOVER_CODE_VERIFIED",
          entityType: "ORDER",
          entityId: order.id,
          metadataJson: JSON.stringify({
            orderNumber: order.orderNumber,
            verifiedBy: session.id,
            disputeDeadline: disputeDeadline.toISOString(),
          }),
        },
      }).catch(() => {});

      // In-app Notification for Buyer
      if (order.buyerId) {
        await createNotification({
          userId: order.buyerId,
          type: "ORDER_STATUS",
          title: "Item Handover Confirmed",
          message: `The vendor verified your handover code for Order #${order.orderNumber}. Your 48-hour buyer inspection period is now active.`,
          link: `/orders/${order.id}`,
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: "Delivery code verified successfully! Order marked as delivered and confirmed.",
        orderId: order.id,
        status: "confirmed",
        disputeDeadline: disputeDeadline.toISOString(),
      });
    }

    // MISMATCH: Increment attempt counter
    const newAttempts = deliveryRecord.attempts + 1;
    const shouldLock = newAttempts >= 5;

    await prisma.deliveryCode.update({
      where: { orderId: order.id },
      data: {
        attempts: newAttempts,
        locked: shouldLock,
      },
    });

    if (shouldLock) {
      // Log security event
      await prisma.activityLog.create({
        data: {
          userId: session.id,
          action: "DELIVERY_CODE_LOCKED",
          entityType: "ORDER",
          entityId: order.id,
          metadataJson: JSON.stringify({ attempts: newAttempts, orderId: order.id }),
        },
      }).catch(() => {});

      return NextResponse.json(
        {
          error: "Incorrect code. Maximum 5 attempts reached. Code has been locked for fraud protection.",
          locked: true,
          attemptsRemaining: 0,
        },
        { status: 423 }
      );
    }

    return NextResponse.json(
      {
        error: `Incorrect delivery code. ${5 - newAttempts} attempts remaining before security lock.`,
        attemptsRemaining: 5 - newAttempts,
        locked: false,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Verify Delivery Code Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to verify code" }, { status: 500 });
  }
}
