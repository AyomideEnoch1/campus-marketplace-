import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify buyer ownership
    const isBuyer = order.buyerId === session.id || order.buyerEmail === session.email;
    const isAdmin = (session as any).role === "ADMIN";

    if (!isBuyer && !isAdmin) {
      return NextResponse.json({ error: "Only the buyer can open a dispute" }, { status: 403 });
    }

    if (order.dispute) {
      return NextResponse.json(
        { error: "A dispute is already active or recorded for this order", disputeId: order.dispute.id },
        { status: 400 }
      );
    }

    // Must be in delivered or confirmed status
    if (order.escrow_status !== "delivered" && order.escrow_status !== "confirmed") {
      return NextResponse.json(
        { error: `Cannot dispute order in '${order.escrow_status}' status. Only delivered/confirmed orders can be disputed.` },
        { status: 400 }
      );
    }

    // 48-hour dispute window verification
    if (order.delivered_at) {
      const deliveredTime = new Date(order.delivered_at).getTime();
      const fortyEightHoursMs = 48 * 60 * 60 * 1000;
      if (Date.now() > deliveredTime + fortyEightHoursMs && !isAdmin) {
        return NextResponse.json(
          { error: "The 48-hour dispute window following delivery has expired." },
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
