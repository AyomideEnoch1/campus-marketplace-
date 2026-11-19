import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendOrderConfirmationEmail, sendVendorOrderNotificationEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [{ buyerId: session.id }, { buyerEmail: session.email }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        meetupPoint: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        vendor: {
          include: {
            campus: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: {
                  take: 1,
                  orderBy: { position: "asc" },
                  select: { url: true },
                },
              },
            },
            review: {
              select: {
                id: true,
                rating: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const sanitizedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.status,
      deliveryMethod: o.deliveryMethod,
      deliveryAddress: o.deliveryAddress,
      meetupPoint: o.meetupPoint,
      notes: o.notes,
      paid_at: o.paid_at ? o.paid_at.toISOString() : null,
      escrow_status: o.escrow_status,
      escrow_mode: o.escrow_mode,
      tx_ref: o.tx_ref,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      vendor: {
        id: o.vendor.id,
        storeName: o.vendor.storeName,
        slug: o.vendor.slug,
        whatsapp: o.vendor.whatsapp,
        sellerType: o.vendor.sellerType,
        isTrustedSeller: o.vendor.isTrustedSeller,
        isRegisteredBusiness: o.vendor.isRegisteredBusiness,
        campus: o.vendor.campus
          ? {
              name: o.vendor.campus.name,
              city: o.vendor.campus.city,
            }
          : null,
      },
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        product: {
          id: i.product.id,
          title: i.product.title,
          slug: i.product.slug,
          images: i.product.images,
        },
        review: i.review,
      })),
    }));

    return NextResponse.json({ orders: sanitizedOrders });
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

const orderSchema = z.object({
  buyerName: z.string().min(2, "Please enter your full name"),
  buyerEmail: z.string().email("Please provide a valid email address"),
  buyerPhone: z.string().min(8, "Please enter a valid phone/WhatsApp number"),
  campusId: z.string().optional(),
  deliveryAddress: z.string().min(3, "Please specify your pickup spot or hostel address"),
  deliveryMethod: z.enum(["PICKUP", "CAMPUS_DELIVERY", "SAFE_MEETUP_POINT"]).default("PICKUP"),
  meetupPointId: z.string().optional().nullable(),
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
      meetupPointId,
      vendorId,
      notes,
      items,
    } = parsed.data;

    // Verify vendor by ID, slug, or via product lookup
    let vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { campus: true, user: true },
    });

    if (!vendor) {
      // Fallback: vendorId was passed as vendor slug
      vendor = await prisma.vendorProfile.findUnique({
        where: { slug: vendorId },
        include: { campus: true, user: true },
      });
    }

    if (!vendor && items.length > 0) {
      // Additional fallback: resolve vendor via the first product in cart
      const firstProduct = await prisma.product.findUnique({
        where: { id: items[0].productId },
        include: { vendor: { include: { campus: true, user: true } } },
      });
      if (firstProduct?.vendor) {
        vendor = firstProduct.vendor;
      }
    }

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "This merchant store is currently suspended and cannot accept orders." },
        { status: 403 }
      );
    }

    // Compute total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // GUEST VENDOR SAFEGUARDS:
    // 1. Enforce Tier 1 order cap of ₦10,000
    if (vendor.sellerType === "guest" && (vendor.verificationTier || 1) < 2 && totalAmount > 10000) {
      return NextResponse.json(
        {
          error:
            "Orders from unverified Tier 1 Guest Vendors are capped at ₦10,000. Please reduce quantity or order from a verified Tier 2+ seller.",
        },
        { status: 400 }
      );
    }

    // 2. Enforce Safe Meetup Point for guest vendors
    let finalMeetupPointId = meetupPointId || null;
    let finalDeliveryAddress = deliveryAddress;

    if (vendor.sellerType === "guest") {
      if (!finalMeetupPointId) {
        // Find default or first active safe meetup point on this campus
        const firstPoint = await prisma.safeMeetupPoint.findFirst({
          where: { campusId: vendor.campusId, active: true },
        });
        if (firstPoint) {
          finalMeetupPointId = firstPoint.id;
          finalDeliveryAddress = `${firstPoint.name} - ${firstPoint.description || ""}`.trim();
        } else {
          return NextResponse.json(
            { error: "Safe campus meetup point selection is required for orders from guest vendors." },
            { status: 400 }
          );
        }
      } else {
        const point = await prisma.safeMeetupPoint.findUnique({
          where: { id: finalMeetupPointId },
        });
        if (point) {
          finalDeliveryAddress = `${point.name} - ${point.description || ""}`.trim();
        }
      }
    }

    // Optional user session if logged in
    const session = await getSession();

    // Generate unique human-readable order number e.g. ORD-202611-7391
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    const newOrder = await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            buyerId: session?.id || null,
            buyerName,
            buyerEmail,
            buyerPhone,
            deliveryAddress: finalDeliveryAddress,
            deliveryMethod,
            meetupPointId: finalMeetupPointId,
            vendorId: vendor.id,
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
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    // Trigger transactional emails asynchronously (non-blocking)
    if (buyerEmail) {
      sendOrderConfirmationEmail(buyerEmail, {
        buyerName,
        orderNumber: newOrder.orderNumber,
        items: items.map((i) => ({
          title: `Item #${i.productId.slice(-5)}`,
          quantity: i.quantity,
          price: i.unitPrice,
        })),
        totalAmount,
        campusName: vendor.campus?.name || "Campus",
        meetupPoint: finalDeliveryAddress,
      }).catch((err) => console.error("Buyer confirmation email error:", err));
    }

    if (vendor.user?.email) {
      sendVendorOrderNotificationEmail(vendor.user.email, {
        storeName: vendor.storeName,
        orderNumber: newOrder.orderNumber,
        buyerName,
        buyerPhone,
        items: items.map((i) => ({
          title: `Item #${i.productId.slice(-5)}`,
          quantity: i.quantity,
          price: i.unitPrice,
        })),
        payoutAmount: totalAmount,
        meetupPoint: finalDeliveryAddress,
      }).catch((err) => console.error("Vendor order notification email error:", err));
    }

    // In-App Real-Time Notification for Vendor
    if (vendor.user?.id) {
      createNotification({
        userId: vendor.user.id,
        type: "ORDER_CREATED",
        title: `New Order #${newOrder.orderNumber}! 🛍️`,
        message: `${buyerName} placed an order (${items.length} items • ₦${totalAmount.toLocaleString()})`,
        link: "/dashboard/orders",
      }).catch((e) => console.error("Vendor order notification error:", e));
    }

    // In-App Real-Time Notification for Buyer
    if (session?.id) {
      createNotification({
        userId: session.id,
        type: "ORDER_STATUS",
        title: `Order #${newOrder.orderNumber} Confirmed 🎉`,
        message: `Your payment is secured in escrow. Awaiting campus pickup.`,
        link: "/orders",
      }).catch((e) => console.error("Buyer order notification error:", e));
    }

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
