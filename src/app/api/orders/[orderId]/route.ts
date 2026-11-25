import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserCampus } from "@/lib/user-campus";

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
      select: {
        id: true,
        orderNumber: true,
        buyerId: true,
        buyerName: true,
        buyerEmail: true,
        buyerPhone: true,
        deliveryAddress: true,
        deliveryMethod: true,
        status: true,
        totalAmount: true,
        subtotal: true,
        fee_amount: true,
        fee_percent: true,
        fee_payer: true,
        commission: true,
        seller_amount: true,
        currency: true,
        tx_ref: true,
        escrow_status: true,
        escrow_mode: true,
        escrow_forced_reason: true,
        paid_at: true,
        delivered_at: true,
        confirmed_at: true,
        released_at: true,
        auto_release_at: true,
        dispute_deadline: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitPrice: true,
            variantDetails: true,
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                  select: { id: true, url: true },
                },
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
        dispute: {
          select: {
            id: true,
            reason: true,
            description: true,
            status: true,
            resolution: true,
            resolutionNotes: true,
            createdAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            txRef: true,
            amount: true,
            currency: true,
            status: true,
            paymentType: true,
            createdAt: true,
          },
        },
        payouts: {
          select: {
            id: true,
            amount: true,
            status: true,
            reference: true,
            createdAt: true,
            completedAt: true,
          },
        },
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

    const buyerCampus = order.buyerId ? await getUserCampus(order.buyerId) : null;

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        buyerCampus,
      },
    });
  } catch (error: any) {
    console.error("[Get Order Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve order" }, { status: 500 });
  }
}
