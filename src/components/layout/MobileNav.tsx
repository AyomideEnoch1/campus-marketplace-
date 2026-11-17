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

  // Don't show public bottom nav inside admin dashboard
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    return null;
  }

  // When signed in: show Saved and Bag
  // When signed out: hide Saved and Bag until after sign in
  const items = user
    ? [
        { label: "Home", href: "/", icon: Home },
        { label: "Sell", href: "/vendor/register", icon: PlusCircle },
        { label: "Shop", href: "/shop", icon: Compass, highlight: true },
        { label: "Saved", href: "/saved", icon: Heart, badge: savedCount },
        { label: "Bag", href: "/cart", icon: ShoppingBag, badge: totalCount },
        {
          label: user.role === "VENDOR" ? "Dashboard" : "Account",
          href: user.role === "VENDOR" ? "/dashboard" : "/account",
          icon: UserIcon,
        },
      ]
    : [
        { label: "Home", href: "/", icon: Home },
        { label: "Sell", href: "/vendor/register", icon: PlusCircle },
        { label: "Shop", href: "/shop", icon: Compass, highlight: true },
        { label: "Sign In", href: "/auth/login", icon: UserIcon },
      ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-neutral-200/80 shadow-lg safe-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.highlight) {
            return (
              <Link
                key={item.href}
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
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
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
                className={`text-[10px] mt-0.5 font-medium ${
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
