"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  User,
  GraduationCap,
  Store,
  LogOut,
  ShieldAlert,
  ChevronDown,
  Menu,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

interface NavbarProps {
  initialUser?: any;
}

export function Navbar({ initialUser }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount } = useCart();
  const { savedCount } = useWishlist();
  const [user, setUser] = React.useState(initialUser);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [selectedCampus, setSelectedCampus] = React.useState<string>("all");

  React.useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.user) {
          setUser(data.user);
        } else if (data === null) {
          setUser(null);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserDropdownOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Campuses", href: "/campuses" },
    { name: "Vendors", href: "/vendors" },
    { name: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Campus Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-neutral-900 leading-none">
                Campus<span className="text-emerald-500">Trade</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 tracking-tight">
                Shop &bull; Sell &bull; Connect
              </span>
            </div>
          </Link>

          {/* Quick Campus Filter Pill - Only visible on the Campuses page */}
          {pathname === "/campuses" && (
            <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-neutral-200">
              <div className="flex items-center gap-1.5 text-xs bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <select
                  aria-label="Filter by Campus"
                  value={selectedCampus}
                  onChange={(e) => {
                    setSelectedCampus(e.target.value);
                    if (e.target.value === "all") {
                      router.push("/campuses");
                    } else {
                      router.push(`/campuses?campus=${e.target.value}`);
                    }
                  }}
                  className="bg-transparent font-medium text-neutral-700 outline-none cursor-pointer pr-1"
                >
                  <option value="all">All Campuses (3)</option>
                  <option value="unilag">UNILAG (Lagos)</option>
                  <option value="ui">UI (Ibadan)</option>
                  <option value="oau">OAU (Ile-Ife)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3.5 py-2 text-sm rounded-full transition-all ${
                  isActive
                    ? "text-emerald-800 bg-emerald-50 font-bold"
                    : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 font-medium"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Wishlist, Cart, Profile */}
        <div className="flex items-center gap-1 md:gap-2.5">
          {/* Wishlist / Saved Items (Only visible after sign in) */}
          {user && (
            <Link
              href="/saved"
              className="hidden sm:flex relative w-10 h-10 rounded-full items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              title="Saved Items"
            >
              <Heart className="w-5 h-5" />
              {savedCount > 0 && (
                <Badge
                  variant="accent"
                  className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white animate-in zoom-in-75"
                >
                  {savedCount}
                </Badge>
              )}
            </Link>
          )}

          {/* Cart / Bag Icon (Only visible after sign in) */}
          {user && (
            <Link
              href="/cart"
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              title="Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-400 text-neutral-950 animate-in zoom-in-75 shadow-xs"
                >
                  {totalCount}
                </Badge>
              )}
            </Link>
          )}

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-neutral-200 hover:border-neutral-300 bg-white shadow-xs transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold uppercase">
                  {user.fullName ? user.fullName[0] : "U"}
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-neutral-800 max-w-[90px] truncate">
                  {user.fullName?.split(" ")[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user.email}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-[10px] uppercase font-bold bg-pink-50 text-pink-700 border-pink-200">
                      {user.role}
                    </Badge>
                  </div>

                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors font-medium"
                    >
                      <ShieldAlert className="w-4 h-4 text-emerald-600" />
                      Admin CMS Dashboard
                    </Link>
                  )}

                  {user.role === "VENDOR" && (
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors font-medium"
                    >
                      <Store className="w-4 h-4 text-emerald-600" />
                      Vendor Dashboard
                    </Link>
                  )}

                  <Link
                    href="/account"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    My Account
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Package className="w-4 h-4 text-neutral-400" />
                    My Orders
                  </Link>

                  <Link
                    href="/saved"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-neutral-400" />
                    Saved Items
                  </Link>

                  <div className="border-t border-neutral-100 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-xs font-semibold px-2.5 sm:px-3">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="hidden sm:inline-flex text-xs font-semibold px-3 sm:px-4 shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
                  Join Free
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-medium ${
                  pathname === link.href
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {!user && (
            <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 text-center font-bold text-sm text-neutral-800 hover:bg-neutral-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold text-sm shadow-sm transition-colors"
              >
                Join Free
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <Link
              href="/vendor/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-pink-50 to-amber-50 border border-emerald-200 text-emerald-950 font-semibold text-sm"
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                Become a Student Seller
              </span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
