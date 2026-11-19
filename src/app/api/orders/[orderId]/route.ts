import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getSession();
    const orderId = params.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }, { tx_ref: orderId }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            whatsapp: true,
            sellerType: true,
            isTrustedSeller: true,
            campus: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        dispute: true,
        payments: true,
        payouts: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Hide vendor phone / sensitive data if payment has not been made yet
    if (order.escrow_status === "pending") {
      if (order.vendor) {
        order.vendor.whatsapp = "";
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("[Get Order Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve order" }, { status: 500 });
  }
}
