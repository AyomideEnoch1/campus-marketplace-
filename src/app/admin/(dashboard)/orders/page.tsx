import { prisma } from "@/lib/prisma";
import { AdminOrdersTable } from "./AdminOrdersTable";
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, totalOrders, pendingOrders, deliveredOrders, totalRevenue] =
    await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: {
              storeName: true,
              campus: { select: { name: true } },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  title: true,
                  images: { take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Campus Orders Overview
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Monitor student order requests, deliveries, and transactions across campuses.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-xl font-black text-white mt-0.5">{totalOrders}</p>
          </div>
          <ShoppingBag className="w-5 h-5 text-blue-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Pending Action
            </p>
            <p className="text-xl font-black text-amber-400 mt-0.5">
              {pendingOrders}
            </p>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Delivered
            </p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {deliveredOrders}
            </p>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Gross Volume
            </p>
            <p className="text-xl font-black text-white mt-0.5">
              ₦{((totalRevenue._sum.totalAmount || 0) / 1000).toFixed(0)}k
            </p>
          </div>
          <Truck className="w-5 h-5 text-purple-400" />
        </div>
      </div>

      <AdminOrdersTable initialOrders={orders as any} />
    </div>
  );
}
