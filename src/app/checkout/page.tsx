"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth-query";
import {
  ShoppingBag,
  ShieldCheck,
  MapPin,
  Truck,
  ArrowLeft,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Building,
  GraduationCap,
  Clock,
  Info,
  RefreshCw,
  Lock,
  Zap,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";
import { Loader } from "@/components/ui/Loader";
import {
  useSafeMeetupPoints,
  SafeMeetupPoint,
  VendorMeta,
} from "@/hooks/use-meetup-points-query";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  FlutterwaveLockedModal,
  CheckoutDataPayload,
} from "@/components/marketplace/FlutterwaveLockedModal";

export const dynamic = "force-dynamic";

interface CheckoutQuote {
  escrow_mode: "escrow" | "direct";
  canToggle: boolean;
  isForced: boolean;
  forcedReason: string | null;
  thresholdCategory: "under_5k" | "5k_to_20k" | "20k_and_above" | string;
  subtotal: number;
  feeAmount: number;
  feePercent: number;
  feePayer: string;
  buyerTotal: number;
  sellerAmount: number;
  commission: number;
  kobo: {
    subtotal: number;
    fee: number;
    buyerTotal: number;
  };
}

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get("vendorId");
  const { data: authData } = useCurrentUser();
  const user = authData?.user;

  const { itemsByVendor, clearVendorItems } = useCart();

  const [buyerName, setBuyerName] = React.useState("");
  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [buyerPhone, setBuyerPhone] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState<
    "PICKUP" | "CAMPUS_DELIVERY" | "SAFE_MEETUP_POINT"
  >("CAMPUS_DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [selectedMeetupPointId, setSelectedMeetupPointId] =
    React.useState<string>("");
  const [notes, setNotes] = React.useState("");

  // Escrow Selection & Dynamic Quote State (Backend is source of truth)
  const [buyerWantsDirect, setBuyerWantsDirect] = React.useState(false);
  const [quote, setQuote] = React.useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = React.useState(true);
  const [quoteError, setQuoteError] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Flutterwave Live Locked & Modal State
  const [lockedModalOpen, setLockedModalOpen] = React.useState(false);
  const isFlutterwaveLocked =
    process.env.NEXT_PUBLIC_FLUTTERWAVE_LOCKED !== "false";

  // Target vendor group
  const vendorIds = Object.keys(itemsByVendor);
  const selectedVendorId = vendorIdParam || vendorIds[0];
  const group = selectedVendorId ? itemsByVendor[selectedVendorId] : null;

  const queryClient = useQueryClient();

  // Cached remote vendor & safe meetup points state via TanStack Query
  const { data: meetupData, isLoading: fetchingMeta } = useSafeMeetupPoints(
    group?.vendor.id,
  );
  const vendorMeta = meetupData?.vendor || null;
  const meetupPoints = meetupData?.meetupPoints || [];

  const isGuestBuyer = !user;
  const isNonStudentVendor =
    vendorMeta?.sellerType === "guest" || group?.vendor?.sellerType === "guest";
  const isGuestSeller = isNonStudentVendor;
  const verificationTier =
    vendorMeta?.verificationTier ?? group?.vendor?.verificationTier ?? 1;

  // Auto-fill buyer details if logged in
  React.useEffect(() => {
    if (user) {
      if (!buyerName && user.fullName) setBuyerName(user.fullName);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
      if (!buyerPhone && user.phone) setBuyerPhone(user.phone);
    }
  }, [user, buyerName, buyerEmail, buyerPhone]);

  React.useEffect(() => {
    // Only auto-suggest campus meetup point for student-to-student transactions on campus
    if (!isNonStudentVendor && !isGuestBuyer) {
      if (meetupPoints.length > 0 && !selectedMeetupPointId) {
        setSelectedMeetupPointId(meetupPoints[0].id);
        if (!deliveryAddress) {
          setDeliveryAddress(
            `${meetupPoints[0].name} - ${meetupPoints[0].description || ""}`.trim(),
          );
        }
      }
    }
  }, [isNonStudentVendor, isGuestBuyer, meetupPoints, selectedMeetupPointId, deliveryAddress]);

  // Check Tier 1 cap
  const isTier1Capped =
    isGuestSeller && verificationTier < 2 && (group?.subtotal || 0) > 10000;

  // Fetch verified checkout quote from backend
  const fetchQuote = React.useCallback(
    async (wantsDirect: boolean) => {
      if (!group || group.items.length === 0) return;
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const payload = {
          items: group.items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
          })),
          buyerWantsDirect: wantsDirect,
        };

        const res = await fetch("/api/payments/checkout-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(
            data.error || "Failed to calculate pricing and escrow quote.",
          );
        }

        setQuote(data.quote);
        // If server rules force escrow, ensure client toggle state is kept in sync
        if (data.quote.isForced && wantsDirect) {
          setBuyerWantsDirect(false);
        }
      } catch (err: any) {
        console.error("[Checkout Quote Error]:", err);
        setQuoteError(err.message || "Failed to calculate escrow & fee quote.");
      } finally {
        setQuoteLoading(false);
      }
    },
    [group],
  );

  React.useEffect(() => {
    fetchQuote(buyerWantsDirect);
  }, [fetchQuote, buyerWantsDirect]);

  const handleSelectMeetupPoint = (point: SafeMeetupPoint) => {
    setSelectedMeetupPointId(point.id);
    setDeliveryAddress(`${point.name} - ${point.description || ""}`.trim());
  };

  const handleToggleEscrow = (wantsDirect: boolean) => {
    setBuyerWantsDirect(wantsDirect);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    if (!buyerName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!buyerEmail.trim() || !buyerEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!buyerPhone.trim() || buyerPhone.trim().length < 7) {
      setError(
        "Please enter a valid contact phone number (at least 7 digits).",
      );
      return;
    }

    if (!deliveryAddress.trim()) {
      setError(
        isNonStudentVendor || isGuestBuyer
          ? "Please enter your full delivery address."
          : "Please enter your preferred meeting point or hostel room."
      );
      return;
    }

    if (isTier1Capped) {
      setError(
        "Orders from Tier 1 Non-Student Vendors are capped at ₦10,000 for buyer security. Please adjust your order.",
      );
      return;
    }

    setError("");

    // If live Flutterwave payments are locked, intercept with professional locked UI modal
    if (isFlutterwaveLocked) {
      setLockedModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        buyerName,
        buyerEmail,
        buyerPhone,
        deliveryMethod: isNonStudentVendor || isGuestBuyer ? "CAMPUS_DELIVERY" : deliveryMethod,
        deliveryAddress: deliveryAddress.trim(),
        meetupPointId: !isNonStudentVendor && !isGuestBuyer ? selectedMeetupPointId || null : null,
        vendorId: group.vendor.id || group.vendor.slug,
        notes,
        buyerWantsDirect,
        items: group.items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          variantDetails: (i as any).condition || undefined,
        })),
      };

      // Call Flutterwave create-payment endpoint
      const res = await fetch("/api/payments/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Failed to initialize Flutterwave payment",
        );
      }

      // Clear the vendor's items from the cart
      clearVendorItems(group.vendor.id);

      // Redirect directly to Flutterwave hosted checkout
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        router.push(`/checkout/confirm?tx_ref=${data.txRef}`);
      }
    } catch (err: any) {
      setError(
        err.message || "Something went wrong while initiating your checkout.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!group || group.items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto text-2xl">
          📦
        </div>
        <h2 className="text-xl font-bold text-neutral-900">
          No Items to Check Out
        </h2>
        <p className="text-xs text-neutral-500">
          Your selected vendor items are empty or already ordered.
        </p>
        <Link href="/cart">
          <Button variant="outline" size="sm">
            &larr; Back to Bag
          </Button>
        </Link>
      </div>
    );
  }

  const effectiveTotal = quote ? quote.buyerTotal : group.subtotal;
  const effectiveSubtotal = quote ? quote.subtotal : group.subtotal;
  const effectiveFee = quote ? quote.feeAmount : 0;
  const effectiveCommission = quote
    ? quote.commission
    : Math.round(group.subtotal * 0.05);
  const effectiveSellerNet = quote
    ? quote.sellerAmount
    : Math.round(group.subtotal * 0.95);
  const isEscrowMode = quote
    ? quote.escrow_mode === "escrow"
    : !buyerWantsDirect;

  const checkoutData: CheckoutDataPayload | null = group
    ? {
        buyerName,
        buyerEmail,
        buyerPhone,
        deliveryMethod: isNonStudentVendor || isGuestBuyer ? "CAMPUS_DELIVERY" : deliveryMethod,
        deliveryAddress: deliveryAddress.trim(),
        meetupPointId: !isNonStudentVendor && !isGuestBuyer ? selectedMeetupPointId || null : null,
        vendorId: group.vendor.id || group.vendor.slug,
        vendorName: group.vendor.storeName,
        vendorWhatsApp: group.vendor.whatsapp || null,
        notes,
        totalAmount: effectiveTotal,
        items: group.items.map((i) => ({
          id: i.id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
      }
    : null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {loading && <Loader isModal={true} />}
      <div className="flex items-center gap-2 mb-6 text-xs text-neutral-500">
        <Link
          href="/cart"
          className="hover:text-neutral-900 flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-bold">Order Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Buyer Details Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isGuestSeller ? (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-bold flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    Non-Student Vendor Order
                  </Badge>
                ) : (
                  <Badge className="bg-neutral-100 text-neutral-800 border-neutral-200/80 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    Student Vendor Order
                  </Badge>
                )}

                {vendorMeta?.isRegisteredBusiness && (
                  <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-xs font-bold flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    Registered Business
                  </Badge>
                )}

                {vendorMeta?.isTrustedSeller && (
                  <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    Trusted Seller
                  </Badge>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 mt-2">
                {isNonStudentVendor
                  ? "Non-Student Vendor Order & Delivery Details"
                  : "Student Contact & Pickup Info"}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Ordering from <strong>{group.vendor.storeName}</strong> (
                {group.vendor.campus?.name})
              </p>
            </div>

            {/* Non-Student Vendor Protection Banner */}
            {isNonStudentVendor && (
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-1.5 text-xs text-purple-900">
                <div className="flex items-center gap-2 font-bold text-purple-950">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  Direct Buyer Delivery &bull; Escrow Protected
                </div>
                <p className="text-[11px] leading-relaxed text-purple-800">
                  This vendor is an off-campus merchant. Your items will be dispatched directly to your specified delivery address. Payment remains held in secure escrow until you confirm delivery.
                </p>
              </div>
            )}

            {/* Tier 1 Guest Limit Warning */}
            {isTier1Capped && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Order Amount Exceeds Tier 1 Guest Cap
                </div>
                <p className="text-[11px] text-amber-800">
                  Orders from newly registered Tier 1 Non-Student Vendors are capped
                  at <strong>₦10,000</strong> for security. Your cart total is{" "}
                  <strong>{formatNGN(group.subtotal)}</strong>. Please reduce
                  item quantity or order from a verified Tier 2+ seller.
                </p>
              </div>
            )}

            {/* Quote Error Notification */}
            {quoteError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{quoteError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchQuote(buyerWantsDirect)}
                  className="text-xs font-bold text-amber-800 underline hover:text-amber-950"
                >
                  Retry Quote
                </button>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Escrow Protection Selection Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-neutral-900">
                    Payment Protection Policy
                  </span>
                </div>
                {quoteLoading ? (
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Checking
                    eligibility...
                  </span>
                ) : quote?.isForced ? (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">
                    Escrow Mandatory
                  </Badge>
                ) : quote?.canToggle ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                    Escrow Optional
                  </Badge>
                ) : (
                  <Badge className="bg-neutral-100 text-neutral-700 border-neutral-200 text-[10px] font-bold">
                    Direct Settlement
                  </Badge>
                )}
              </div>

              {/* Case 1: Escrow is Mandatory (Forced due to amount >=20k, guest seller, high risk category, or order splitting) */}
              {quote?.isForced && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200/80 text-xs text-purple-900 space-y-1">
                    <p className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-700" />
                      Mandatory Escrow Protection Applied
                    </p>
                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      {quote.forcedReason ||
                        "Platform security policy requires escrow protection for this transaction."}
                    </p>
                    <p className="text-[10px] text-purple-700 pt-1">
                      Funds are held safely in platform escrow until you receive
                      and verify your 6-digit delivery code. Includes a 48-hour
                      inspection dispute window.
                    </p>
                  </div>
                </div>
              )}

              {/* Case 2: Escrow is Optional (Standard Tier ₦5,000–₦19,999 and canToggle is true) */}
              {quote && quote.canToggle && !quote.isForced && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    This order qualifies for optional buyer protection. Choose
                    how you would like to complete your payment:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option A: Escrow Protected */}
                    <label
                      onClick={() => handleToggleEscrow(false)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        !buyerWantsDirect
                          ? "border-emerald-600 bg-emerald-50/40 shadow-xs"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="escrowChoice"
                            checked={!buyerWantsDirect}
                            onChange={() => handleToggleEscrow(false)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-bold text-xs text-neutral-900">
                            Escrow Protection
                          </span>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Recommended
                        </Badge>
                      </div>
                      <p className="text-[11px] text-neutral-600 leading-tight">
                        1% service fee (
                        {formatNGN(Math.round(group.subtotal * 0.01))}). Funds
                        held safely until you verify handover with your 6-digit
                        code. 48-hour dispute window included.
                      </p>
                    </label>

                    {/* Option B: Direct Settlement */}
                    <label
                      onClick={() => handleToggleEscrow(true)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        buyerWantsDirect
                          ? "border-neutral-800 bg-neutral-50 shadow-xs"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="escrowChoice"
                            checked={buyerWantsDirect}
                            onChange={() => handleToggleEscrow(true)}
                            className="text-neutral-900 focus:ring-neutral-700"
                          />
                          <span className="font-bold text-xs text-neutral-900">
                            Direct Payment
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500">
                          ₦0 Fee
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-tight">
                        Vendor receives payout directly upon payment
                        verification. No 6-digit delivery code or 48-hour escrow
                        dispute window.
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Case 3: Sub-₦5,000 Micro Order (Direct by default) */}
              {quote &&
                !quote.isForced &&
                (quote.thresholdCategory === "under_5k" ||
                  quote.thresholdCategory === "MICRO" ||
                  quote.subtotal < 5000) && (
                  <div className="p-3 rounded-xl bg-neutral-100/80 border border-neutral-200 text-xs text-neutral-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                      <Info className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Micro-Transaction (Under ₦5,000)</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      Orders below ₦5,000 qualify for direct campus settlement
                      with <strong>₦0 escrow fees</strong>. The standard
                      price-based escrow protection threshold begins at ₦5,000.
                    </p>
                  </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Your Full Name
                </label>
                <Input
                  required
                  maxLength={70}
                  placeholder="e.g. Demilade Johnson"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    WhatsApp / Phone Number
                  </label>
                  <Input
                    type="tel"
                    required
                    minLength={7}
                    maxLength={15}
                    placeholder="+234 801 234 5678"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    required
                    maxLength={100}
                    placeholder="student@university.edu.ng"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Delivery / Pickup Choice */}
              {isNonStudentVendor || isGuestBuyer ? (
                /* NON-STUDENT VENDOR or GUEST BUYER: Direct Address Delivery */
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Buyer Delivery Address
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <Input
                    required
                    maxLength={250}
                    placeholder="Enter your full delivery address (e.g. 15 Admiralty Way, Lekki / Apt 4B, Off Campus, Lagos)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="h-11 rounded-xl text-xs bg-white border-neutral-300 focus-visible:ring-emerald-500"
                  />
                  <p className="text-[11px] text-neutral-500">
                    The vendor will deliver or dispatch your order directly to this address.
                  </p>
                </div>
              ) : (
                /* STUDENT VENDOR + REGISTERED STUDENT BUYER: Standard Delivery / Pickup Choice */
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <label className="text-xs font-bold text-neutral-700">
                    How would you like to receive your items?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        deliveryMethod === "PICKUP"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="method"
                          checked={deliveryMethod === "PICKUP"}
                          onChange={() => setDeliveryMethod("PICKUP")}
                          className="text-emerald-600"
                        />
                        <span className="font-bold text-xs text-neutral-900">
                          Campus Hub Pickup
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        Free meeting at faculty quads, library, or SUB
                      </span>
                    </label>

                    <label
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        deliveryMethod === "CAMPUS_DELIVERY"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="method"
                          checked={deliveryMethod === "CAMPUS_DELIVERY"}
                          onChange={() => setDeliveryMethod("CAMPUS_DELIVERY")}
                          className="text-emerald-600"
                        />
                        <span className="font-bold text-xs text-neutral-900">
                          Hostel Delivery
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        Vendor delivers to your room or hostel block
                      </span>
                    </label>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-neutral-700">
                      {deliveryMethod === "PICKUP"
                        ? "Preferred Campus Meeting Point"
                        : "Hostel Name & Room Number"}
                    </label>
                    <Input
                      required
                      maxLength={200}
                      placeholder={
                        deliveryMethod === "PICKUP"
                          ? "e.g. UNILAG Library steps or UI Mellanby Hall front"
                          : "e.g. Queen Amina Hall, Room B12"
                      }
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Special Notes for Vendor (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                  placeholder="e.g. Available after 2 PM lectures on Tuesday..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    quoteLoading ||
                    isTier1Capped ||
                    !buyerName.trim() ||
                    !buyerEmail.trim() ||
                    !buyerPhone.trim() ||
                    !deliveryAddress.trim()
                  }
                  className={`w-full h-12 text-white font-bold rounded-2xl shadow-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isGuestSeller
                      ? "bg-purple-700 hover:bg-purple-800 shadow-purple-700/25"
                      : isEscrowMode
                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                        : "bg-neutral-900 hover:bg-neutral-800 shadow-neutral-900/25"
                  }`}
                >
                  {isFlutterwaveLocked ? (
                    <Lock className="w-4 h-4 mr-1.5 inline" />
                  ) : isEscrowMode ? (
                    <ShieldCheck className="w-4 h-4 mr-1.5 inline" />
                  ) : (
                    <Zap className="w-4 h-4 mr-1.5 inline" />
                  )}
                  {loading
                    ? "Initializing Payment..."
                    : isFlutterwaveLocked
                      ? `Proceed to Payment (${formatNGN(effectiveTotal)}) →`
                      : isEscrowMode
                        ? `Pay Securely via Escrow (${formatNGN(effectiveTotal)}) →`
                        : `Pay Directly (${formatNGN(effectiveTotal)}) →`}
                </Button>
                {isFlutterwaveLocked ? (
                  <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl py-1.5 px-3 mt-2.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Live online card payment locked &bull; Pay-on-Campus
                      Meetup ready
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-500 mt-2.5">
                    {isEscrowMode ? (
                      <>
                        <span>🔒</span>
                        <span>
                          100% Escrow Protected: Funds held until you verify
                          delivery with your 6-digit code
                        </span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>
                          Direct Payment: Seller is paid immediately upon
                          payment confirmation
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>Order Summary ({group.items.length} items)</span>
              {/* {isGuestSeller ? (
                <span className="text-[11px] text-purple-700 font-semibold">
                  Guest Seller
                </span>
              ) : (
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Student Seller
                </span>
              )} */}
            </h3>

            <div className="space-y-3 divide-y divide-neutral-100">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={item.image}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-200"
                    />
                    <div className="truncate">
                      <p className="font-bold text-neutral-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-neutral-400 text-[11px]">
                        Qty: {item.quantity} &times; {formatNGN(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900 shrink-0">
                    {formatNGN(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Complete Fee Breakdown (Backend-driven) */}
            <div className="pt-3 border-t border-neutral-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Product Subtotal</span>
                <span className="font-semibold text-neutral-900">
                  {formatNGN(effectiveSubtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span>{isNonStudentVendor ? "Direct Delivery" : "Campus Handover"}</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span className="flex items-center gap-1">
                  <span>Escrow Protection Fee</span>
                  {quote && quote.feePercent > 0 && (
                    <span className="text-[10px] text-neutral-400">
                      ({quote.feePercent}%)
                    </span>
                  )}
                </span>
                {quoteLoading ? (
                  <span className="text-[11px] text-neutral-400">
                    Calculating...
                  </span>
                ) : effectiveFee > 0 ? (
                  <span className="text-emerald-700 font-bold">
                    +{formatNGN(effectiveFee)}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">
                    ₦0 (Free / Direct)
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-base font-extrabold text-neutral-950">
                <span>Total Payable by Buyer</span>
                <span
                  className={
                    isGuestSeller
                      ? "text-purple-700"
                      : isEscrowMode
                        ? "text-emerald-600"
                        : "text-neutral-900"
                  }
                >
                  {formatNGN(effectiveTotal)}
                </span>
              </div>
            </div>

            {/* Seller Proceeds & Commission Breakdown Transparency */}
            {/* <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-150 text-[11px] space-y-1.5 text-neutral-600"> */}
            {/* <div className="flex items-center justify-between font-medium">
                <span className="text-neutral-500">
                  Platform Commission (5%):
                </span>
                <span className="text-neutral-700 font-semibold">
                  -{formatNGN(effectiveCommission)}
                </span>
              </div> */}
            {/* <div className="flex items-center justify-between font-bold text-neutral-900 border-t border-neutral-200/60 pt-1">
                <span>Expected Seller Net Proceeds:</span>
                <span className="text-emerald-700">
                  {formatNGN(effectiveSellerNet)}
                </span>
              </div> */}
            {/* <p className="text-[10px] text-neutral-400 leading-tight pt-0.5">
                Marketplace commission is deducted from the seller's proceeds,
                not added to the buyer total.
              </p>
            </div> */}

            {/* Payment provider badge */}
            <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-neutral-500">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <span>💳</span> Powered by <strong>Flutterwave</strong>
                </span>
                {isFlutterwaveLocked && (
                  <Badge className="bg-amber-100/90 text-amber-900 border-amber-300/80 text-[10px] font-bold py-0 px-2 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-amber-700" />
                    Locked (Live Gateway Onboarding)
                  </Badge>
                )}
              </div>
              <span>Cards &bull; Bank Transfers &bull; USSD</span>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-neutral-100/70 text-xs text-neutral-600 space-y-2">
            <p className="font-bold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {isNonStudentVendor
                ? "Escrow Buyer Protection Guarantee"
                : "Verified Student Protection"}
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              {isNonStudentVendor ? (
                <>
                  Your order is protected under full platform Escrow safeguards. Your payment is held securely and only released to vendor{" "}
                  <strong>{group.vendor.storeName}</strong> after you receive and confirm your order at your delivery address.
                </>
              ) : (
                <>
                  Your order details will be sent directly to{" "}
                  <strong>{group.vendor.storeName}</strong>. You will receive an
                  immediate confirmation link to communicate with the student
                  seller.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Improvised Professional Modal when Flutterwave is clicked / locked */}
      <FlutterwaveLockedModal
        isOpen={lockedModalOpen}
        onClose={() => setLockedModalOpen(false)}
        checkoutData={checkoutData}
        onOrderPlaced={(orderNumber) => {
          if (group?.vendor?.id) {
            clearVendorItems(group.vendor.id);
          }
          router.push(`/order-success/${orderNumber}`);
        }}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <React.Suspense fallback={<Loader isModal={true} />}>
        <CheckoutForm />
      </React.Suspense>
    </div>
  );
}
