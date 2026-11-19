"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  User,
  GraduationCap,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Package,
  Compass,
  Sparkles,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useCurrentUser, useLogout } from "@/hooks/use-auth-query";
import { SignoutModal } from "@/components/ui/SignoutModal";
import { SignInAsBuyerButton } from "@/components/vendor/SignInAsBuyerButton";
import { NotificationBell } from "./NotificationBell";
import { SearchBar } from "@/components/marketplace/SearchBar";

interface NavbarProps {
  initialUser?: any;
}

export function Navbar({ initialUser }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount } = useCart();
  const { savedCount } = useWishlist();

  // Deduplicated TanStack Query cached auth state
  const { data: authData } = useCurrentUser(initialUser);
  const user = authData?.user ?? initialUser;
  const logoutMutation = useLogout();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [selectedCampus, setSelectedCampus] = React.useState<string>("all");
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  // Determine current page context
  const isVendorDashboard = pathname.startsWith("/dashboard");
  const isAdminDashboard = pathname.startsWith("/admin");
  const isCheckout = pathname.startsWith("/checkout");

  // Close menus on page navigation
  React.useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setIsSigningOut(true);
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setTimeout(() => {
          setIsSigningOut(false);
        }, 400);
      },
      onError: () => {
        setIsSigningOut(false);
      },
      onSettled: () => {
        setTimeout(() => {
          setIsSigningOut(false);
        }, 600);
      },
    });
  };

  // On vendor dashboard and admin dashboard, their dedicated shell/sidebar owns the header
  if (isVendorDashboard || isAdminDashboard) {
    return null;
  }

  // 1. Distraction-Free Minimal Checkout Header
  if (isCheckout) {
    return (
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-rose-400 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg text-neutral-900 tracking-tight">
              Campus<span className="text-emerald-500">Trade</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Escrow Checkout</span>
          </div>

          <Link
            href="/cart"
            className="text-xs font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
          >
            &larr; Back to Bag
          </Link>
        </div>
      </header>
    );
  }

  // 2. Standard Public Marketplace Header
  const navLinks = [
    { name: "Home", href: "/", icon: GraduationCap },
    { name: "Shop", href: "/shop", icon: Compass },
    { name: "Campuses", href: "/campuses", icon: GraduationCap },
    { name: "Vendors", href: "/vendors", icon: ShoppingBag },
    { name: "About", href: "/about", icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-neutral-900 leading-none">
                Campus<span className="text-emerald-500">Trade</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 tracking-tight hidden sm:inline-block">
                Shop &bull; Sell &bull; Connect
              </span>
            </div>
          </Link>

          {/* Shop Search Bar in Navbar on large screen after brand name */}
          {pathname.startsWith("/shop") && (
            <div className="hidden lg:flex items-center ml-2 xl:ml-4 w-60 xl:w-80">
              <SearchBar
                placeholder="Search campus drops & goods..."
                size="sm"
                className="w-full shadow-2xs rounded-full border-neutral-200/90 focus-within:border-emerald-500"
              />
            </div>
          )}

          {/* Quick Campus Filter Pill - Only visible on desktop on Campuses page */}
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

        {/* Center Nav Links (Desktop md+) */}
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

        {/* Right Actions: Wishlist, Cart, Notifications, Profile, Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Wishlist / Saved Items (Only on screens >= sm; mobile has bottom nav) */}
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

          {/* Cart / Bag Icon (Screens >= sm; mobile has bottom nav) */}
          {user && (
            <Link
              href="/cart"
              className="hidden sm:flex relative w-10 h-10 rounded-full items-center justify-center text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
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

          {/* Real-Time Notification Bell (Visible on both mobile & desktop when signed in) */}
          {user && <NotificationBell currentUserId={user.id} />}

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2.5 sm:pr-3 py-1 sm:py-1.5 rounded-full border border-neutral-200 hover:border-neutral-300 bg-white shadow-xs transition-colors cursor-pointer"
                aria-label="User Account Menu"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                  {user.fullName ? user.fullName[0] : "U"}
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-neutral-800 max-w-[85px] truncate">
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
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 font-bold transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
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

                  {user.role === "VENDOR" && (
                    <SignInAsBuyerButton variant="dropdown" />
                  )}

                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
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

          {/* Hamburger Menu Button - Prominently visible across ALL public pages on mobile screens */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-2xl border border-neutral-200/80 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-neutral-900" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation: Slides down cleanly across all public pages */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          {/* Main Navigation Links */}
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-3 pb-1">
              Explore CampusTrade
            </p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 font-bold shadow-xs"
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-neutral-400"}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Campus Chips (Instant Filter Access) */}
          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-1">
              Filter by University Campus
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: "All Campuses", slug: "all" },
                { name: "UNILAG", slug: "unilag" },
                { name: "UI", slug: "ui" },
                { name: "OAU", slug: "oau" },
              ].map((c) => (
                <Link
                  key={c.slug}
                  href={c.slug === "all" ? "/campuses" : `/campuses?campus=${c.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-800 text-neutral-700 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Signed-in Account Shortcuts */}
          {user && (
            <div className="pt-2 border-t border-neutral-100 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-3 pb-1">
                Your Account
              </p>
              {user.role === "VENDOR" && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold bg-emerald-600 text-white shadow-xs"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4" />
                    Vendor Dashboard
                  </span>
                  <span>&rarr;</span>
                </Link>
              )}
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Package className="w-4 h-4 text-neutral-400" />
                My Orders
              </Link>
              <Link
                href="/saved"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Heart className="w-4 h-4 text-neutral-400" />
                Saved Items ({savedCount})
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <User className="w-4 h-4 text-neutral-400" />
                Account Profile
              </Link>
            </div>
          )}

          {/* Guest Sign In & Join Buttons */}
          {!user && (
            <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-2xl border border-neutral-200 text-center font-bold text-sm text-neutral-800 hover:bg-neutral-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold text-sm shadow-sm transition-colors"
              >
                Join Free
              </Link>
            </div>
          )}

          {/* Become a Student Seller Banner */}
          {user?.role !== "VENDOR" && (
            <div className="pt-2 border-t border-neutral-100">
              <Link
                href="/vendor/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/90 text-emerald-950 font-bold text-xs shadow-xs group"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  Become a Student Seller
                </span>
                <span className="text-emerald-700">&rarr;</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Blocking Signout Modal */}
      <SignoutModal isOpen={isSigningOut || logoutMutation.isPending} onClose={() => setIsSigningOut(false)} />
    </header>
  );
}