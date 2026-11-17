"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Palette,
  ShoppingBag,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Add Product", href: "/dashboard/products/new", icon: PlusCircle },
  { label: "Store Customizer", href: "/dashboard/customize", icon: Palette },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Store Settings", href: "/dashboard/settings", icon: Settings },
];

export function VendorSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
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
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default VendorSidebarNav;
