"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ticket,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Package,
  Percent,
  LayoutDashboard,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { VendorEntitlements } from "@/lib/vendor-entitlements";

interface VendorActivateClientProps {
  vendor: {
    id: string;
    storeName: string;
    status: string;
    accessState: string;
    accessExpiresAt: string | null;
    approvedAt: string | null;
  };
  entitlements: VendorEntitlements;
  latestRedemption: {
    code: string;
    status: string;
    redeemedAt: string;
    accessExpiresAt: string;
    releasedAt: string | null;
    releaseReason: string | null;
  } | null;
}

export function VendorActivateClient({
  vendor,
  entitlements: initialEntitlements,
  latestRedemption,
}: VendorActivateClientProps) {
  const router = useRouter();
  const [entitlements, setEntitlements] = React.useState<VendorEntitlements>(initialEntitlements);
  const [couponCode, setCouponCode] = React.useState<string>("");
  const [loadingCoupon, setLoadingCoupon] = React.useState<boolean>(false);
  const [loadingPayment, setLoadingPayment] = React.useState<boolean>(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);

  const hasActiveAccess = entitlements.hasAccess;
  const isExpired = entitlements.accessState === "EXPIRED";

  // Redeem Coupon handler
  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setCouponError("Please enter your coupon code.");
      return;
    }

    setLoadingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/vendor/access/redeem-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid coupon code, or this coupon is currently unavailable.");
      }

      toast.success(data.message || "Founding coupon activated!");
      if (data.entitlements) {
        setEntitlements(data.entitlements);
      }
      setCouponCode("");
      router.refresh();
    } catch (err: any) {
      setCouponError(err.message || "Failed to redeem coupon.");
      toast.error(err.message || "Failed to redeem coupon.");
    } finally {
      setLoadingCoupon(false);
    }
  };

  // Payment Activation handler (Flutterwave / Pay)
  const handlePayActivation = async () => {
    setLoadingPayment(true);
    try {
      const res = await fetch("/api/vendor/access/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays: 365 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment processing error.");
      }

      toast.success(data.message || "Paid access activated successfully!");
      if (data.entitlements) {
        setEntitlements(data.entitlements);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Unable to complete activation payment.");
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 font-bold">
          Vendor Access &amp; Entitlements
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">
          Activate Your Storefront on ọjà
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
          Activate your store access to unlock dashboard selling tools, listing slots, and 0% commission on campus orders.
        </p>
      </div>

      {/* Current Status Card if already active or expired */}
      {hasActiveAccess ? (
        <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-neutral-900">
                  Vendor Access is Active
                </h3>
                <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
                  {entitlements.planType === "coupon" ? "Founding Coupon" : "Paid Plan"}
                </Badge>
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Expires on{" "}
                <strong>
                  {entitlements.accessExpiresAt
                    ? new Date(entitlements.accessExpiresAt).toLocaleDateString()
                    : "Active"}
                </strong>{" "}
                ({entitlements.daysRemaining} days remaining)
              </p>
            </div>
          </div>

          <Link href="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm">
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : isExpired ? (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-950">
                Your Access Period Has Expired
              </h3>
              <p className="text-xs text-rose-800 mt-1 max-w-md">
                Your published listings have been temporarily hidden from the public shop. Renew access now to restore your products and commission-free selling instantly.
              </p>
            </div>
          </div>

          <Button
            onClick={handlePayActivation}
            disabled={loadingPayment}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shrink-0"
          >
            {loadingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay to Restore Access"}
          </Button>
        </div>
      ) : null}

      {/* WHAT ACCESS INCLUDES (Shared entitlements callout) */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-extrabold text-neutral-900">
            What Every Activated Vendor Receives
          </h2>
        </div>
        <p className="text-xs text-neutral-500">
          Paid and founding coupon vendors enjoy identical benefits through our single entitlements engine:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-xs">Full Vendor Dashboard</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Catalog management, real-time analytics, order tracking, and escrow notifications.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-xs">50 Product Listing Slots</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Generous product listing slots for student textbooks, tech, fashion, or store items.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-neutral-900 text-xs">0% Commission Selling</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Keep 100% of your product earnings during your active period with zero commission deduction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVATION OPTIONS (Payment option stays visible until valid code applied) */}
      {!hasActiveAccess && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OPTION 1: FOUNDING VENDOR COUPON CODE */}
          <div className="bg-white rounded-3xl border-2 border-emerald-500/80 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-2xl tracking-wider">
              Free Access
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900">
                    Founding Vendor Coupon
                  </h3>
                  <p className="text-xs text-neutral-500">
                    180 days free access &bull; 0% commission
                  </p>
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                If you were granted a Founding Vendor coupon code by university administration or an ambassador, enter it below to claim an active slot.
              </p>

              <form onSubmit={handleRedeemCoupon} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700">Coupon Code</label>
                  <Input
                    placeholder="e.g. FOUNDING50"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ""));
                      setCouponError(null);
                    }}
                    className="rounded-xl text-xs font-mono font-bold uppercase mt-1 h-11 border-neutral-300"
                  />
                </div>

                {couponError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {couponError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loadingCoupon || !couponCode.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-11 shadow-md shadow-emerald-600/20"
                >
                  {loadingCoupon ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                    </span>
                  ) : (
                    "Apply Coupon Code"
                  )}
                </Button>
              </form>
            </div>

            <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
              Slots are capped per code. A coupon slot will be released if no product is listed within 60 days of approval.
            </div>
          </div>

          {/* OPTION 2: STANDARD VENDOR PAYMENT PLAN */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900">
                    Standard Vendor Access
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Annual storefront access
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-neutral-900">
                  ₦15,000 <span className="text-xs font-normal text-neutral-500">/ 1 Year Access</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Instant activation via card, bank transfer, or USSD.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-neutral-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>365 days continuous campus selling</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>0% commission on all completed campus orders</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to 50 active listing slots</span>
                </li>
              </ul>
            </div>

            <Button
              type="button"
              onClick={handlePayActivation}
              disabled={loadingPayment}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl h-11 shadow-sm"
            >
              {loadingPayment ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Activation...
                </span>
              ) : (
                "Pay ₦15,000 &amp; Activate Now"
              )}
            </Button>

            <div className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
              Payment remains visible until a valid coupon code is applied or access is activated.
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE GATE NOTICE (APPROVAL + ACCESS) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-100/80 border border-neutral-200/80 text-xs text-neutral-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-neutral-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-neutral-900">
            Publishing Requirement: Both Gates Must Pass
          </p>
          <p className="leading-relaxed">
            Your products appear in the public campus shop only when <strong>BOTH</strong> gates pass: your vendor access is active (via coupon or payment) <strong>AND</strong> your student/business credentials have been reviewed and approved by campus administration.
          </p>
        </div>
      </div>
    </div>
  );
}
