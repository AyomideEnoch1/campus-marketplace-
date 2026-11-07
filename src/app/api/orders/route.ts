import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const orderSchema = z.object({
  buyerName: z.string().min(2, "Please enter your full name"),
  buyerEmail: z.string().email("Please provide a valid email address"),
  buyerPhone: z.string().min(8, "Please enter a valid phone/WhatsApp number"),
  campusId: z.string().optional(),
  deliveryAddress: z.string().min(3, "Please specify your pickup spot or hostel address"),
  deliveryMethod: z.enum(["PICKUP", "CAMPUS_DELIVERY"]).default("PICKUP"),
  vendorId: z.string().min(1, "Vendor ID is required"),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().positive(),
    })
  ).min(1, "Order must contain at least one item"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid order information" },
        { status: 400 }
      );
    }

    const {
      buyerName,
      buyerEmail,
      buyerPhone,
      deliveryAddress,
      deliveryMethod,
      vendorId,
      notes,
      items,
    } = parsed.data;

    // Verify vendor
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { campus: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Optional user session if logged in
    const session = await getSession();

    // Compute total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Generate unique human-readable order number e.g. ORD-202611-7391
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId: session?.id || null,
          buyerName,
          buyerEmail,
          buyerPhone,
          deliveryAddress,
          deliveryMethod,
          vendorId,
          totalAmount,
          notes: notes || null,
          status: "PENDING",
        },
      });

      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        });

        // Decrement stock if in stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "ORDER_CREATED",
          entityType: "Order",
          entityId: order.id,
          metadataJson: JSON.stringify({
            orderNumber,
            totalAmount,
            vendorStore: vendor.storeName,
          }),
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        totalAmount: newOrder.totalAmount,
        vendorStoreName: vendor.storeName,
        vendorWhatsApp: vendor.whatsapp,
      },
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit order request" },
      { status: 500 }
    );
  }
}
