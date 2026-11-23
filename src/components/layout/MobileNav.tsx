"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  ShoppingBag,
  Heart,
  User as UserIcon,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { useCurrentUser } from "@/hooks/use-auth-query";

interface MobileNavProps {
  initialUser?: any;
}

export function MobileNav({ initialUser = null }: MobileNavProps) {
  const pathname = usePathname();
  const { savedCount } = useWishlist();
  const { totalCount } = useCart();

  // Deduplicated TanStack Query auth state
  const { data: authData } = useCurrentUser(initialUser);
  const user = authData?.user ?? initialUser;

  const isVendor = user?.role === "VENDOR";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  // Build items symmetrically with exactly 5 items so "Shop" is ALWAYS in the center slot (index 2)
  const items = React.useMemo(() => {
    if (isVendor) {
      // Vendor layout: "Sell" is hidden. Exactly 5 items with Shop in center.
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Saved", href: "/saved", icon: Heart, badge: savedCount },
        { label: "Shop", href: "/shop", icon: Compass, highlight: true },
        { label: "Bag", href: "/cart", icon: ShoppingBag, badge: totalCount },
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ];
    }

    if (isAdmin) {
      // Admin layout: Exactly 5 items with Shop in center.
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Saved", href: "/saved", icon: Heart, badge: savedCount },
        { label: "Shop", href: "/shop", icon: Compass, highlight: true },
        { label: "Bag", href: "/cart", icon: ShoppingBag, badge: totalCount },
        { label: "Admin", href: "/admin", icon: ShieldCheck },
      ];
    }

    if (user) {
      // Signed-in regular buyer: Exactly 5 items with Shop in center.
      return [
        { label: "Home", href: "/", icon: Home },
        { label: "Sell", href: "/vendor/register", icon: PlusCircle },
        { label: "Shop", href: "/shop", icon: Compass, highlight: true },
        { label: "Bag", href: "/cart", icon: ShoppingBag, badge: totalCount },
        { label: "Account", href: "/account", icon: UserIcon },
      ];
    }

    // Guest / Signed-out user: Exactly 5 items with Shop in center.
    return [
      { label: "Home", href: "/", icon: Home },
      { label: "Sell", href: "/vendor/register", icon: PlusCircle },
      { label: "Shop", href: "/shop", icon: Compass, highlight: true },
      { label: "Bag", href: "/cart", icon: ShoppingBag, badge: totalCount },
      { label: "Sign In", href: "/auth/login", icon: UserIcon },
    ];
  }, [isVendor, isAdmin, user, savedCount, totalCount]);

  // Don't show bottom nav inside admin or chat rooms (to preserve chat viewport)
  if (
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/messages") ||
    pathname.startsWith("/messages") ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"))
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-neutral-200/80 shadow-lg safe-bottom"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.highlight) {
            return (
              <div key={item.href} className="flex justify-center w-full">
                <Link
                  href={item.href}
                  className="relative -top-3 flex flex-col items-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors w-full ${
                isActive
                  ? "text-emerald-600"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium truncate max-w-full ${
                  isActive ? "font-bold text-emerald-600" : "text-neutral-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
