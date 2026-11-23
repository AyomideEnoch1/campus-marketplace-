"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Timer,
  Palette,
  ShoppingBag,
  MessageSquare,
  Settings,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Add Product", href: "/dashboard/products/new", icon: PlusCircle },
  { label: "Pricing & Access", href: "/dashboard/activate", icon: ShieldCheck },
  { label: "Promotions", href: "/dashboard/promotions", icon: Timer },
  { label: "Store Customizer", href: "/dashboard/customize", icon: Palette },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Customer Chat", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Store Settings", href: "/dashboard/settings", icon: Settings },
];

interface VendorSidebarNavProps {
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function VendorSidebarNav({
  collapsed = false,
  onItemClick,
}: VendorSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        if (collapsed) {
          return (
            <div key={item.label} className="relative group flex justify-center">
              <Link
                href={item.href}
                onClick={onItemClick}
                aria-label={item.label}
                title={item.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-emerald-600"
                  }`}
                />
              </Link>

              {/* Floating Tooltip */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden md:group-hover:flex items-center">
                <div className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                  {item.label}
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80"
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? "text-white" : "text-emerald-600"
              }`}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default VendorSidebarNav;
