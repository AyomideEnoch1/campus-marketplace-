"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  Heart,
  Star,
  Store,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package,
  ExternalLink,
  LogOut,
  Sparkles,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatNGN, formatDate } from "@/lib/utils";

interface AccountUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  createdAt: string | Date;
  vendorProfile: {
    id: string;
    storeName: string;
    slug: string;
    status: string;
    campus?: {
      id: string;
      name: string;
      city: string;
    } | null;
  } | null;
  orders: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string | Date;
    vendor: {
      storeName: string;
    };
    items: {
      id: string;
      quantity: number;
      product: {
        title: string;
        images?: { url: string }[];
      };
    }[];
  }[];
  favoritesCount: number;
  reviewsCount: number;
  totalOrdersCount: number;
}

interface AccountClientProps {
  initialUser: AccountUser;
}

export function AccountClient({ initialUser }: AccountClientProps) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(initialUser.fullName);
  const [phone, setPhone] = React.useState(initialUser.phone || "");
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSaveSuccess(true);
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold whitespace-nowrap">
            Confirmed
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold whitespace-nowrap">
            Delivered
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-semibold whitespace-nowrap">
            Cancelled
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold whitespace-nowrap">
            Pending
          </Badge>
        );
    }
  };

  const initials = initialUser.fullName
    ? initialUser.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20 pt-8 sm:pt-12">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* User Hero Banner */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                {initials}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                    {initialUser.fullName}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-bold uppercase tracking-wider">
                    {initialUser.role === "VENDOR" ? "Campus Vendor" : initialUser.role === "ADMIN" ? "Admin" : "Student Buyer"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    {initialUser.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Member since {formatDate(initialUser.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/orders" className="group">
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm group-hover:border-emerald-300 group-hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Orders</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                  {initialUser.totalOrdersCount}
                </span>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                  View order history <ChevronRight className="w-3 h-3" />
                </p>
              </div>
            </div>
          </Link>

          <Link href="/saved" className="group">
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm group-hover:border-rose-300 group-hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Saved Items</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                  {initialUser.favoritesCount}
                </span>
                <p className="text-[11px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                  View wishlist <ChevronRight className="w-3 h-3" />
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Reviews</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                {initialUser.reviewsCount}
              </span>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                Verified reviews shared
              </p>
            </div>
          </div>

          {initialUser.vendorProfile ? (
            <Link href="/dashboard" className="group">
              <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-sm group-hover:border-emerald-300 group-hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Vendor Store</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-base sm:text-lg font-bold text-neutral-900 truncate block">
                    {initialUser.vendorProfile.storeName}
                  </span>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                    Manage store <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/vendor/register" className="group">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-md shadow-emerald-600/20 group-hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Sell on Campus</span>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                </div>
                <div className="mt-3">
                  <span className="text-base sm:text-lg font-bold block">Open Your Store</span>
                  <p className="text-[11px] text-emerald-100 font-medium mt-0.5 flex items-center gap-1">
                    Free vendor signup <ArrowRight className="w-3 h-3" />
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Main Content 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Center: Recent Orders */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Recent Orders</h2>
                  <p className="text-xs text-neutral-500">Track and manage your campus purchases</p>
                </div>
                <Link href="/orders">
                  <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl gap-1.5">
                    View All Orders <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {initialUser.orders.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Package className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-800">No orders yet</p>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Explore student vendors on campus and buy snacks, textbooks, gadgets, and services.
                    </p>
                  </div>
                  <Link href="/shop" className="inline-block pt-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
                      Explore Campus Market
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {initialUser.orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 hover:border-neutral-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-neutral-900">#{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-neutral-600">
                          From <strong>{order.vendor.storeName}</strong> &bull; {order.items.length} item{order.items.length > 1 ? "s" : ""}
                        </p>
                        <p className="text-[11px] text-neutral-400">{formatDate(order.createdAt)}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200/50">
                        <div className="sm:text-right">
                          <span className="text-[11px] text-neutral-400 block">Total</span>
                          <span className="font-extrabold text-sm text-neutral-900">
                            {formatNGN(order.totalAmount)}
                          </span>
                        </div>
                        <Link href={`/order-success/${order.orderNumber}`}>
                          <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-700 hover:bg-emerald-100/60 rounded-xl">
                            Receipt &rarr;
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Safety Tip */}
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-5 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-emerald-950">
                <p className="font-bold">Campus Trade Safe Pickup Recommendation</p>
                <p className="text-emerald-800 leading-relaxed">
                  Always inspect physical items in daylight at high-traffic campus spots (faculty halls, SUB, library lobby) before completing delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Account Settings & Contact info */}
          <div className="space-y-6">
            {/* Profile Information Form */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-sm space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900">Contact Details</h3>
                <p className="text-xs text-neutral-500">Your details for pickup & delivery coordination</p>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Profile updated successfully!
                </div>
              )}

              {saveError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {saveError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Full Name</label>
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="rounded-xl text-xs h-10"
                    placeholder="e.g. Samuel Adekunle"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Email Address</label>
                  <Input
                    type="email"
                    disabled
                    value={initialUser.email}
                    className="rounded-xl text-xs h-10 bg-neutral-100/70 text-neutral-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-neutral-400">Email address cannot be changed</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Phone / WhatsApp Number</label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl text-xs h-10"
                    placeholder="e.g. 08012345678"
                  />
                  <span className="text-[10px] text-neutral-400">Used by sellers to coordinate campus dropoffs</span>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-10 shadow-sm mt-2"
                >
                  {saving ? "Saving Changes..." : "Save Profile"}
                </Button>
              </form>
            </div>

            {/* Campus Affiliation */}
            {initialUser.vendorProfile?.campus && (
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 shadow-sm space-y-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                  Campus Affiliation
                </span>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-extrabold text-neutral-900">
                    {initialUser.vendorProfile.campus.name}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {initialUser.vendorProfile.campus.city}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
