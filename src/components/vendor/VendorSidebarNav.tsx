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
  Lock,
  Wallet,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Add Product", href: "/dashboard/products/new", icon: PlusCircle },
  { label: "Wallet & Payouts", href: "/dashboard/wallet", icon: Wallet },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Pricing & Access", href: "/dashboard/activate", icon: ShieldCheck },
  { label: "Promotions", href: "/dashboard/promotions", icon: Timer },
  { label: "Store Customizer", href: "/dashboard/customize", icon: Palette },
  { label: "Customer Chat", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Store Settings", href: "/dashboard/settings", icon: Settings },
];

interface VendorSidebarNavProps {
  collapsed?: boolean;
  onItemClick?: () => void;
  isApproved?: boolean;
}

export function VendorSidebarNav({
  collapsed = false,
  onItemClick,
  isApproved = true,
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

        const isAddProductLocked = item.href === "/dashboard/products/new" && !isApproved;

        if (collapsed) {
          return (
            <div key={item.label} className="relative group flex justify-center">
              <Link
                href={item.href}
                onClick={onItemClick}
                aria-label={isAddProductLocked ? `${item.label} (Approval Required)` : item.label}
                title={isAddProductLocked ? `${item.label} (Approval Required)` : item.label}
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
                <div className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {isAddProductLocked && (
                    <span className="text-[10px] text-amber-300 font-normal">(Approval Required)</span>
                  )}
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
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-white" : "text-emerald-600"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </div>

            {isAddProductLocked && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default VendorSidebarNav;
