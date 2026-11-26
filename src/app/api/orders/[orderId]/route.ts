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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const orderId = params.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }, { tx_ref: orderId }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Must be the buyer or an admin
    const isBuyer = order.buyerId === session.id || order.buyerEmail === session.email;
    const isAdmin = (session as any).role === "ADMIN" || (session as any).role === "SUPERADMIN";

    if (!isBuyer && !isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to delete this order." },
        { status: 403 }
      );
    }

    // Safety check: Cannot delete paid orders or orders with active escrow
    if (order.paid_at || ["paid_held", "held", "confirmed", "delivered", "released"].includes(order.escrow_status)) {
      return NextResponse.json(
        { error: "Cannot delete paid or escrow-protected orders. Please file a dispute or contact support if you need a refund." },
        { status: 400 }
      );
    }

    // Perform deletion and stock restoration in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Restore product stock for each ordered item
      for (const item of order.items) {
        if (item.productId && item.quantity > 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          }).catch((err) => {
            console.warn(`[Delete Order]: Could not restore stock for product ${item.productId}:`, err);
          });
        }
      }

      // 2. Delete the order (cascading deletes will handle items, deliveryCode, payments, etc.)
      await tx.order.delete({
        where: { id: order.id },
      });

      // 3. Log activity
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: "ORDER_DELETED",
          entityType: "ORDER",
          entityId: order.id,
          metadataJson: JSON.stringify({
            orderNumber: order.orderNumber,
            deletedBy: session.id,
            reason: "Buyer deleted unpaid order",
          }),
        },
      }).catch(() => {});
    });

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} deleted successfully.`,
    });
  } catch (error: any) {
    console.error("[Delete Order Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to delete order" }, { status: 500 });
  }
}
