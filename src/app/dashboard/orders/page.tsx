import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VendorOrdersClient } from "./VendorOrdersClient";

export default async function VendorOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
  });
  if (!vendor) redirect("/vendor/register");

  const orders = await prisma.order.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: true },
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
          Review incoming campus orders, contact buyers via WhatsApp, and mark status
        </p>
      </div>

      <VendorOrdersClient initialOrders={orders as any} />
    </div>
  );
}
