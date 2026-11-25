import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VendorOrdersClient } from "./VendorOrdersClient";

export default async function VendorOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!vendor) redirect("/auth/register?role=vendor");

  const orders = await prisma.order.findMany({
    where: {
      vendorId: vendor.id,
      OR: [
        { paid_at: { not: null } },
        { escrow_status: { in: ["pending", "held", "paid_held", "confirmed", "delivered", "disputed", "payout_pending", "released", "refunded"] } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      orderNumber: true,
      buyerId: true,
      status: true,
      escrow_status: true,
      escrow_mode: true,
      buyerName: true,
      buyerEmail: true,
      buyerPhone: true,
      deliveryAddress: true,
      deliveryMethod: true,
      notes: true,
      subtotal: true,
      commission: true,
      seller_amount: true,
      totalAmount: true,
      paid_at: true,
      delivered_at: true,
      confirmed_at: true,
      dispute_deadline: true,
      createdAt: true,
      deliveryCode: {
        select: {
          attempts: true,
          locked: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          variantDetails: true,
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

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
          Buyer Order Requests
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Review incoming campus orders, chat with buyers, and mark fulfillment status
        </p>
      </div>

      <VendorOrdersClient initialOrders={orders as any} />
    </div>
  );
}
