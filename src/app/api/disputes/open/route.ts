import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { notificationService } from "@/lib/email/notification-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason, description, evidencePaths } = body;

    if (!orderId || !reason || !description) {
      return NextResponse.json(
        { error: "orderId, reason, and detailed description are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        dispute: true,
        vendor: {
          select: {
            id: true,
            userId: true,
            storeName: true,
            user: { select: { email: true, fullName: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify buyer ownership
    const isBuyer = order.buyerId === session.id || order.buyerEmail === session.email;
    const isAdmin = (session as any).role === "ADMIN" || (session as any).role === "SUPERADMIN";

    if (!isBuyer && !isAdmin) {
      return NextResponse.json({ error: "Only the buyer can open a dispute" }, { status: 403 });
    }

    if (order.dispute) {
      return NextResponse.json(
        { error: "A dispute is already active or recorded for this order", disputeId: order.dispute.id },
        { status: 400 }
      );
    }

    // Verify status and inspection window based on dispute reason
    if (reason === "VENDOR_NO_SHOW") {
      if (
        order.escrow_status !== "paid_held" &&
        order.escrow_status !== "delivered" &&
        order.escrow_status !== "confirmed"
      ) {
        return NextResponse.json(
          {
            error: `Cannot report vendor no-show for order in '${order.escrow_status}' status. Payment must be confirmed.`,
          },
          { status: 400 }
        );
      }
    } else {
      // For item-condition disputes, order must have been handed over
      if (order.escrow_status !== "delivered" && order.escrow_status !== "confirmed") {
        return NextResponse.json(
          {
            error: `Cannot dispute item condition in '${order.escrow_status}' status. Only delivered orders can be inspected and disputed.`,
          },
          { status: 400 }
        );
      }

      // Inspection & dispute window verification from handover (delivered_at)
      if (!order.delivered_at) {
        return NextResponse.json(
          { error: "Cannot dispute item condition for an order that has not been confirmed as handed over." },
          { status: 400 }
        );
      }

      const disputeDeadlineMs = order.dispute_deadline
        ? new Date(order.dispute_deadline).getTime()
        : new Date(order.delivered_at).getTime() + 24 * 60 * 60 * 1000;

      if (Date.now() > disputeDeadlineMs && !isAdmin) {
        return NextResponse.json(
          { error: "The inspection and dispute window following item handover has expired." },
          { status: 400 }
        );
      }
    }

    // Atomic: Create Dispute & Freeze Order Funds
    const [newDispute] = await prisma.$transaction([
      prisma.dispute.create({
        data: {
          orderId: order.id,
          buyerId: session.id || order.buyerId || "guest_buyer",
          reason,
          description,
          evidencePaths: evidencePaths ? JSON.stringify(evidencePaths) : null,
          status: "open",
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          escrow_status: "disputed",
        },
      }),
    ]);

    // Send in-app notification to seller
    if (order.vendor?.userId) {
      await createNotification({
        userId: order.vendor.userId,
        type: "ORDER_STATUS",
        title: "Dispute Opened — Payout Frozen",
        message: `Buyer opened a dispute for Order #${order.orderNumber} (${reason}). Payout is frozen pending review.`,
        link: "/dashboard/orders",
      }).catch(() => {});
    }

    // Dispatch emails to Super Admin, Vendor, and Buyer
    notificationService.notifyAdminNewDispute({
      orderNumber: order.orderNumber,
      disputeId: newDispute.id,
      reason,
      buyerName: order.buyerName || "Student",
      storeName: order.vendor?.storeName || "Vendor",
      orderTotal: order.totalAmount || 0,
    }).catch(() => {});

    if (order.vendor?.user?.email) {
      notificationService.notifyVendorDisputeOpened({
        email: order.vendor.user.email,
        orderNumber: order.orderNumber,
        storeName: order.vendor.storeName,
        reason,
        buyerName: order.buyerName || "Student",
        amount: order.totalAmount || 0,
      }).catch(() => {});
    }

    if (order.buyerEmail) {
      notificationService.notifyBuyerDisputeUpdate({
        email: order.buyerEmail,
        orderNumber: order.orderNumber,
        buyerName: order.buyerName || "Student",
        status: "OPENED",
        reason,
        notes: "Your dispute has been logged. Escrow funds are held while administrators review the details.",
      }).catch(() => {});
    }

    // Audit Log
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: "DISPUTE_OPENED",
        entityType: "ORDER",
        entityId: order.id,
        metadataJson: JSON.stringify({
          disputeId: newDispute.id,
          reason,
          orderNumber: order.orderNumber,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Dispute opened successfully. Funds have been frozen in escrow pending admin review.",
      disputeId: newDispute.id,
      orderStatus: "disputed",
    });
  } catch (error: any) {
    console.error("[Open Dispute Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to open dispute" }, { status: 500 });
  }
}
