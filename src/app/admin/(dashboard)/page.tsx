import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Users,
  Package,
  MapPin,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { PageTrafficItem } from "@/components/admin/TrafficPieChart";

const TrafficPieChart = dynamic(
  () => import("@/components/admin/TrafficPieChart").then((m) => m.TrafficPieChart),
  {
    loading: () => (
      <div className="h-72 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse" />
    ),
  }
);

async function getAdminMetrics() {
  const [
    totalVendors,
    pendingVendors,
    totalProducts,
    totalCampuses,
    totalOrders,
    recentVendors,
    recentProducts,
    siteSettings,
  ] = await Promise.all([
    prisma.vendorProfile.count(),
    prisma.vendorProfile.count({ where: { status: "PENDING" } }),
    prisma.product.count(),
    prisma.campus.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.vendorProfile.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        campus: { select: { name: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { storeName: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.siteSetting.findMany(),
  ]);

  let totalViews = 0;
  let uniqueVisitors = 0;
  let topPages: PageTrafficItem[] = [];

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [viewsCount, visitorGroups, pageGroups] = await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.pageView.groupBy({
        by: ["visitorId"],
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
    ]);

    totalViews = viewsCount;
    uniqueVisitors = visitorGroups.length;
    topPages = pageGroups.map((g) => ({
      path: g.path,
      views: g._count.id,
    }));
  } catch {
    // Gracefully fall back if PageView table has not been migrated yet
  }

  return {
    totalVendors,
    pendingVendors,
    totalProducts,
    totalCampuses,
    totalOrders,
    recentVendors,
    recentProducts,
    siteSettings,
    totalViews,
    uniqueVisitors,
    topPages,
  };
}

export default async function AdminDashboardPage() {
  const {
    totalVendors,
    pendingVendors,
    totalProducts,
    totalCampuses,
    totalOrders,
    recentVendors,
    recentProducts,
    siteSettings,
    totalViews,
    uniqueVisitors,
    topPages,
  } = await getAdminMetrics();

  const statCards = [
    {
      label: "Total Vendors",
      value: totalVendors,
      sub: `${pendingVendors} awaiting approval`,
      icon: Users,
      color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
    },
    {
      label: "Active Products",
      value: totalProducts,
      sub: "Across all campuses",
      icon: Package,
      color: "text-blue-400 bg-blue-950/60 border-blue-800/60",
    },
    {
      label: "Active Campuses",
      value: totalCampuses,
      sub: "UNILAG, UI, OAU",
      icon: MapPin,
      color: "text-amber-400 bg-amber-950/60 border-amber-800/60",
    },
    {
      label: "Order Requests",
      value: totalOrders,
      sub: "Student transactions",
      icon: ShoppingBag,
      color: "text-purple-400 bg-purple-950/60 border-purple-800/60",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Overview
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time multi-vendor activity, campus signups, and moderation control
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/users?action=add">
            <Button size="sm" variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 gap-1.5 font-bold text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              + Add Admin
            </Button>
          </Link>
          <Link href="/admin/vendors">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 font-bold text-xs">
              Manage Vendors ({pendingVendors} Pending)
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-3 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider truncate">
                  {stat.label}
                </p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-0.5 sm:mt-1">
                  {stat.value}
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 sm:mt-1 truncate">{stat.sub}</p>
              </div>
              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 ${stat.color}`}>
                <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Site Traffic & Most Visited Pages Pie Chart */}
      <TrafficPieChart
        totalViews={totalViews}
        uniqueVisitors={uniqueVisitors}
        topPages={topPages}
        windowDays={30}
      />

      {/* Two Column Section: Recent Vendors & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Vendors */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Registered Student Vendors
            </h3>
            <Link
              href="/admin/vendors"
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">
                      {vendor.storeName}
                    </span>
                    <Badge
                      variant={
                        vendor.status === "APPROVED"
                          ? "default"
                          : vendor.status === "PENDING"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px] px-2 py-0 shrink-0 whitespace-nowrap"
                    >
                      {vendor.status}
                    </Badge>
                  </div>
                  <p className="text-neutral-400 truncate mt-0.5">
                    {vendor.user.fullName} &bull; {vendor.campus.name.split(" ")[0]}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-medium text-neutral-300">
                    {vendor._count.products} Products
                  </span>
                  <p className="text-[10px] text-neutral-500">
                    {formatDate(vendor.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Products */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Recent Product Listings
            </h3>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate">
                  <span className="font-bold text-white truncate block">
                    {prod.title}
                  </span>
                  <p className="text-neutral-400 truncate mt-0.5">
                    {prod.vendor.storeName} &bull; {prod.category.name}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-400">
                    ₦{prod.price.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-neutral-500 uppercase">
                    {prod.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
