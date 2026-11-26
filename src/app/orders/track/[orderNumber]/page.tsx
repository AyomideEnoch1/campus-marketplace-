import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserCampus } from "@/lib/user-campus";
import { decryptCode } from "@/lib/crypto";
import { OrderTrackingClient } from "./OrderTrackingClient";

export const dynamic = "force-dynamic";

interface OrderTrackingPageProps {
  params: { orderNumber: string };
}

export async function generateMetadata({
  params,
}: OrderTrackingPageProps): Promise<Metadata> {
  return {
    title: `Track Order #${params.orderNumber} | ọjà`,
    description: `Real-time milestone tracking and campus delivery status for order #${params.orderNumber}.`,
  };
}

export default async function OrderTrackingPage({
  params,
}: OrderTrackingPageProps) {
  const session = await getSession();

  if (!session) {
    redirect(`/auth/login?redirect=/orders/track/${params.orderNumber}`);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      deliveryCode: true,
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
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Ensure user is authorized to track this order (buyer or vendor or admin)
  const isBuyer = order.buyerId === session.id || order.buyerEmail === session.email;
  const isVendor = order.vendor.userId === session.id;
  const isAdmin = session.role === "ADMIN" || session.role === "SUPERADMIN";

  if (!isBuyer && !isVendor && !isAdmin) {
    redirect("/orders");
  }

  // Only decrypt deliveryCode if the caller is the buyer or admin (NEVER for vendor!)
  let buyerDeliveryCode: string | null = null;
  if ((isBuyer || isAdmin) && order.deliveryCode?.codeHash) {
    const parts = order.deliveryCode.codeHash.split("|");
    if (parts.length > 1) {
      buyerDeliveryCode = decryptCode(parts[1]);
    }
  }

  const buyerCampus = order.buyerId ? await getUserCampus(order.buyerId) : null;

  const sanitizedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    deliveryCode: buyerDeliveryCode,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    buyerEmail: order.buyerEmail,
    buyerCampus: buyerCampus,
    totalAmount: order.totalAmount,
    status: order.status,
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress,
    meetupPoint: order.meetupPoint,
    notes: order.notes,
    paid_at: order.paid_at ? order.paid_at.toISOString() : null,
    escrow_status: order.escrow_status,
    escrow_mode: order.escrow_mode,
    tx_ref: order.tx_ref,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    vendor: {
      id: order.vendor.id,
      storeName: order.vendor.storeName,
      slug: order.vendor.slug,
      whatsapp: order.vendor.whatsapp,
      sellerType: order.vendor.sellerType,
      isTrustedSeller: order.vendor.isTrustedSeller,
      isRegisteredBusiness: order.vendor.isRegisteredBusiness,
      campus: order.vendor.campus
        ? {
            name: order.vendor.campus.name,
            city: order.vendor.campus.city,
          }
        : null,
    },
    items: order.items.map((i) => ({
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
    })),
  };

  return <OrderTrackingClient order={sanitizedOrder} />;
}
