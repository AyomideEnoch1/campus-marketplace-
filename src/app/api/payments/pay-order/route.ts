import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPayment } from "@/lib/payments/flutterwave";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { orderId, orderNumber } = body;

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: "Order ID or Order Number is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId || "" },
          { orderNumber: orderNumber || orderId || "" },
        ],
      },
      include: {
        vendor: {
          select: {
            id: true,
            storeName: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check: If authenticated session, buyer must match session or be admin
    if (session) {
      const isBuyer =
        order.buyerId === session.id || order.buyerEmail === session.email;
      const isAdmin = session.role === "ADMIN";
      if (!isBuyer && !isAdmin) {
        return NextResponse.json(
          { error: "You are not authorized to pay for this order" },
          { status: 403 }
        );
      }
    }

    // Check if order is already paid
    if (
      order.paid_at ||
      order.escrow_status === "paid_held" ||
      order.status === "CONFIRMED" ||
      order.status === "DELIVERED"
    ) {
      return NextResponse.json(
        { error: "This order has already been paid for." },
        { status: 400 }
      );
    }

    // Check if order is cancelled
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This order was cancelled and cannot be paid." },
        { status: 400 }
      );
    }

    // Generate fresh txRef for Flutterwave
    const txRef = `ct_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/checkout/confirm?tx_ref=${txRef}`;

    // Update order with new tx_ref
    await prisma.order.update({
      where: { id: order.id },
      data: {
        tx_ref: txRef,
      },
    });

    // Create Flutterwave payment link
    const payment = await createPayment({
      txRef,
      amount: order.totalAmount,
      currency: order.currency || "NGN",
      redirectUrl,
      customer: {
        email: order.buyerEmail,
        name: order.buyerName || "Campus Student",
        phoneNumber: order.buyerPhone || "08000000000",
      },
      customizations: {
        title: `ọjà ${order.escrow_mode === "escrow" ? "Escrow" : "Direct"}: #${order.orderNumber}`,
        description:
          order.escrow_mode === "escrow"
            ? "Payment held safely in escrow until you inspect and accept items."
            : "Direct campus checkout: vendor is paid upon payment verification.",
        logo: `${appUrl}/icons/icon-192x192.png`,
      },
      meta: {
        order_id: order.id,
        order_number: order.orderNumber,
        buyer_id: order.buyerId || session?.id || null,
        seller_id: order.vendorId,
        escrow_mode: order.escrow_mode,
      },
    });

    return NextResponse.json({
      success: true,
      paymentLink: payment.paymentLink,
      txRef,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error("[Pay Order Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate payment for order" },
      { status: 500 }
    );
  }
}
