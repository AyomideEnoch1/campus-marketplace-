import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrdersClient } from "./OrdersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Orders | CampusTrade Marketplace",
  description: "Track your campus purchases, coordinate delivery with student vendors, and leave verified reviews.",
};

export default async function OrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?redirect=/orders");
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { buyerId: session.id },
        { buyerEmail: session.email },
      ],
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
    createdAt: o.createdAt,
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
      review: i.review
        ? {
            id: i.review.id,
            rating: i.review.rating,
            status: i.review.status,
          }
        : null,
    })),
  }));

  return <OrdersClient initialOrders={sanitizedOrders} />;
}
