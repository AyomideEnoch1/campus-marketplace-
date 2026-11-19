export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Package,
  Eye,
  ShoppingBag,
  TrendingUp,
  PlusCircle,
  ExternalLink,
  Palette,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNGN, formatDate } from "@/lib/utils";

async function getVendorDashboardData(userId: string) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId },
    include: {
      campus: true,
      products: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          images: { orderBy: { position: "asc" } },
          category: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: { include: { product: true } },
        },
      },
    },
  });

  if (!vendor) return null;

  // Aggregate stats
  const totalProducts = await prisma.product.count({ where: { vendorId: vendor.id } });
  const publishedProducts = await prisma.product.count({
    where: { vendorId: vendor.id, status: "PUBLISHED" },
  });
  const viewsAggregation = await prisma.product.aggregate({
    where: { vendorId: vendor.id },
    _sum: { viewsCount: true },
  });
  const totalViews = viewsAggregation._sum.viewsCount || 0;
  const totalOrders = await prisma.order.count({ where: { vendorId: vendor.id } });

  return {
    vendor,
    totalProducts,
    publishedProducts,
    totalViews,
    totalOrders,
  };
}

export default async function VendorDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const data = await getVendorDashboardData(session.id);
  if (!data) return null;

  const { vendor, totalProducts, publishedProducts, totalViews, totalOrders } = data;

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      sub: `${publishedProducts} live on shop`,
      icon: Package,
      color: "text-emerald-600 bg-emerald-50",
      href: "/dashboard/products",
    },
    {
      label: "Listing Views",
      value: totalViews,
      sub: "Student impressions",
      icon: Eye,
      color: "text-blue-600 bg-blue-50",
      href: "/dashboard/products",
    },
    {
      label: "Order Requests",
      value: totalOrders,
      sub: "Direct buyer inquiries",
      icon: ShoppingBag,
      color: "text-amber-600 bg-amber-50",
      href: "/dashboard/orders",
    },
    {
      label: "Store Layout",
      value: vendor.layout.toUpperCase(),
      sub: "Switchable in customizer",
      icon: Palette,
      color: "text-purple-600 bg-purple-50",
      href: "/dashboard/customize",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
              Welcome, {vendor.storeName}
            </h1>
            <Badge
              variant={vendor.status === "APPROVED" ? "default" : "warning"}
              className="text-xs"
            >
              {vendor.status}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage your campus catalog, review order requests, and customize your storefront
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/products/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs">
              <PlusCircle className="w-4 h-4" /> Add Product
            </Button>
          </Link>
          <Link href={`/store/${vendor.slug}`} target="_blank">
            <Button variant="outline" size="sm" className="font-semibold gap-1.5 text-xs">
              <ShoppingBag className="w-4 h-4" /> Live Store
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={i}
              href={s.href}
              className="p-3 sm:p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-between gap-2 hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-wider truncate group-hover:text-neutral-700 transition-colors">
                  {s.label}
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 mt-0.5 sm:mt-1 group-hover:text-emerald-600 transition-colors">
                  {s.value}
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 truncate">{s.sub}</p>
              </div>
              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${s.color} group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/products/new"
          className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:scale-[1.01] transition-transform"
        >
          <PlusCircle className="w-6 h-6 mb-2" />
          <h4 className="font-bold text-sm">Add New Product</h4>
          <p className="text-xs text-emerald-100 mt-0.5">
            Upload pictures, set price in ₦, tags, and condition
          </p>
        </Link>

        <Link
          href="/dashboard/customize"
          className="p-4 rounded-2xl bg-gradient-to-tr from-neutral-800 to-neutral-900 text-white shadow-md hover:scale-[1.01] transition-transform"
        >
          <Palette className="w-6 h-6 mb-2 text-amber-400" />
          <h4 className="font-bold text-sm">Storefront Customizer</h4>
          <p className="text-xs text-neutral-300 mt-0.5">
            Switch between Grid, List, Showcase & Lookbook templates
          </p>
        </Link>

        <Link
          href={`/store/${vendor.slug}`}
          target="_blank"
          className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md hover:scale-[1.01] transition-transform"
        >
          <ExternalLink className="w-6 h-6 mb-2 text-blue-200" />
          <h4 className="font-bold text-sm">Share Storefront URL</h4>
          <p className="text-xs text-blue-100 mt-0.5">
            {`/store/${vendor.slug}`}
          </p>
        </Link>
      </div>

      {/* Recent Products Section */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Recent Products</h3>
            <p className="text-xs text-neutral-500">Your latest uploaded inventory</p>
          </div>
          <Link
            href="/dashboard/products"
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            Manage all ({totalProducts}) &rarr;
          </Link>
        </div>

        {vendor.products.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-sm font-semibold text-neutral-700">No products uploaded yet</p>
            <Link href="/dashboard/products/new">
              <Button size="sm">Create First Listing</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {vendor.products.map((prod) => (
              <div
                key={prod.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-neutral-50/60 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                    {prod.images[0] ? (
                      <img
                        src={prod.images[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-sm text-neutral-900 truncate">
                      {prod.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {prod.category.name} &bull; Stock: {prod.stock}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <span className="font-extrabold text-sm text-neutral-900 block">
                      {formatNGN(prod.price)}
                    </span>
                    <Badge
                      variant={prod.status === "PUBLISHED" ? "default" : "secondary"}
                      className="text-[10px] uppercase font-bold"
                    >
                      {prod.status}
                    </Badge>
                  </div>
                  <Link
                    href={`/dashboard/products/${prod.id}/edit`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Order Requests Section */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Recent Order Requests</h3>
            <p className="text-xs text-neutral-500">Incoming buyer orders and escrow payment status</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            View all ({totalOrders}) &rarr;
          </Link>
        </div>

        {vendor.orders.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-sm font-semibold text-neutral-700">No order requests yet</p>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              When students order from your catalog, their order and escrow payment status will show here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {vendor.orders.map((ord) => {
              const isPaid =
                Boolean(ord.paid_at) ||
                ["paid_held", "confirmed", "delivered", "released"].includes(ord.escrow_status);

              return (
                <div
                  key={ord.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 px-2 rounded-xl transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-700 font-bold">
                      <ShoppingBag className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-neutral-900">
                          #{ord.orderNumber}
                        </span>
                        <span className="text-neutral-500">
                          by <strong className="text-neutral-800">{ord.buyerName}</strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {formatDate(ord.createdAt)} &bull; {ord.items.length} item(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Payment Status Badge */}
                    {isPaid ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold flex items-center gap-1 py-0.5 px-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Paid &bull; Escrow</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold flex items-center gap-1 py-0.5 px-2">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>Unpaid</span>
                      </Badge>
                    )}

                    {/* Order Fulfillment Badge */}
                    <Badge
                      variant={
                        ord.status === "DELIVERED"
                          ? "default"
                          : ord.status === "CONFIRMED"
                          ? "campus"
                          : ord.status === "PENDING"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {ord.status}
                    </Badge>

                    {/* Order Amount */}
                    <span className="font-extrabold text-sm text-neutral-900 min-w-[70px] text-right">
                      {formatNGN(ord.totalAmount)}
                    </span>

                    <Link
                      href="/dashboard/orders"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2.5 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-100"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
