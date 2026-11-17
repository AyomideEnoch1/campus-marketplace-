import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decryptCode } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryCode: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify buyer ownership or admin
    const isBuyer = order.buyerId === session.id || order.buyerEmail === session.email;
    const isAdmin = (session as any).role === "ADMIN";

    if (!isBuyer && !isAdmin) {
      return NextResponse.json({ error: "Only the buyer can access the delivery code" }, { status: 403 });
    }

    if (!order.deliveryCode) {
      return NextResponse.json({ error: "No delivery code generated for this order yet" }, { status: 404 });
    }

    const packed = order.deliveryCode.codeHash;
    const parts = packed.split("|");
    let code: string | null = null;

    if (parts.length > 1) {
      code = decryptCode(parts[1]);
    } else {
      // Fallback display if not packed
      code = "******";
    }

    return NextResponse.json({
      success: true,
      code,
      expiresAt: order.deliveryCode.expiresAt,
      locked: order.deliveryCode.locked,
      attemptsRemaining: Math.max(0, 5 - order.deliveryCode.attempts),
      orderStatus: order.escrow_status,
    });
  } catch (error: any) {
    console.error("[Get Delivery Code Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve code" }, { status: 500 });
  }
}
