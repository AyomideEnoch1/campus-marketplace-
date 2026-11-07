import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Palette,
  ShoppingBag,
  Settings,
  ExternalLink,
  Store,
  MapPin,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?redirect=/dashboard");
  }

  // Fetch full vendor profile
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
    include: { campus: true },
  });

  if (!vendor) {
    redirect("/vendor/register");
  }

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/dashboard/products", icon: Package },
    { label: "Add Product", href: "/dashboard/products/new", icon: PlusCircle },
    { label: "Store Customizer", href: "/dashboard/customize", icon: Palette },
    { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { label: "Store Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row text-neutral-900">
      {/* Vendor Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200/80 p-5 flex flex-col justify-between shrink-0 shadow-xs">
        <div className="space-y-6">
          {/* Store Brand Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="w-11 h-11 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
              {vendor.logo ? (
                <img
                  src={vendor.logo}
                  alt={vendor.storeName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-bold text-lg text-white"
                  style={{ backgroundColor: vendor.brandColor || "#059669" }}
                >
                  {vendor.storeName[0]}
                </div>
              )}
            </div>
            <div className="truncate">
              <h2 className="font-bold text-sm text-neutral-950 truncate leading-snug">
                {vendor.storeName}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant={
                    vendor.status === "APPROVED"
                      ? "default"
                      : vendor.status === "PENDING"
                      ? "warning"
                      : "destructive"
                  }
                  className="text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap"
                >
                  {vendor.status}
                </Badge>
                <span className="text-[11px] text-neutral-400 flex items-center">
                  <MapPin className="w-3 h-3 text-emerald-600 mr-0.5" />
                  {vendor.campus?.name.split(" ")[0]}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Approval Notice if not approved yet */}
          {vendor.status === "PENDING" && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Store Awaiting Approval
              </p>
              <p className="text-amber-700 leading-snug">
                You can add and edit products now. Once verified by campus admins, your items will go live!
              </p>
            </div>
          )}

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80 transition-colors"
                >
                  <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Link & User */}
        <div className="pt-4 border-t border-neutral-100 space-y-2">
          <Link
            href={`/store/${vendor.slug}`}
            target="_blank"
            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-900 text-xs font-bold transition-colors"
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-700" />
              View Public Store
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center justify-between pt-2 px-1 text-xs text-neutral-500">
            <span className="truncate max-w-[120px] font-medium">{session.fullName}</span>
            <Link href="/api/auth/logout" className="text-rose-600 hover:underline text-[11px]">
              Logout
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Vendor Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl">
        {children}
      </main>
    </div>
  );
}
