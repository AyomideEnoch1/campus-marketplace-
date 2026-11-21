import { NextRequest, NextResponse } from "next/server";
import { verifyOrderPayment } from "@/lib/payments/verify-order-payment";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const txRef = searchParams.get("tx_ref");
    const transactionId = searchParams.get("transaction_id");
    const statusParam = searchParams.get("status");

    if (!txRef && !transactionId) {
      return NextResponse.json({ error: "Missing tx_ref or transaction_id" }, { status: 400 });
    }

    // If transaction_id is provided, verify directly with Flutterwave
    if (transactionId) {
      const result = await verifyOrderPayment(transactionId, txRef || undefined);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
            orderId: result.orderId,
            txRef: result.txRef,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        orderId: result.orderId,
        txRef: result.txRef,
        status: result.status,
        escrow_mode: result.order?.escrow_mode || "escrow",
      });
    }

    // Fallback: If only tx_ref is provided, check order status in database
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ tx_ref: txRef! }, { orderNumber: txRef! }],
      },
      select: {
        id: true,
        orderNumber: true,
        tx_ref: true,
        escrow_status: true,
        escrow_mode: true,
        totalAmount: true,
        flw_transaction_id: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If order has flw_transaction_id recorded by webhook, verify it
    if (order.flw_transaction_id) {
      const result = await verifyOrderPayment(order.flw_transaction_id, order.tx_ref || undefined);
      return NextResponse.json({
        success: result.success,
        orderId: order.id,
        txRef: order.tx_ref,
        status: result.status || order.escrow_status,
        escrow_mode: order.escrow_mode,
      });
    }

    return NextResponse.json({
      success: order.escrow_status === "paid_held",
      orderId: order.id,
      txRef: order.tx_ref,
      status: order.escrow_status,
      escrow_mode: order.escrow_mode,
    });
  } catch (error: any) {
    console.error("[Verify Payment Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
