"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Store,
  Clock,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SafeMeetupPoint {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface VendorMeta {
  id: string;
  sellerType: "student" | "guest" | string;
  verificationTier: number;
  isTrustedSeller: boolean;
  isRegisteredBusiness: boolean;
  storeName: string;
  campusId: string;
  campus?: {
    id: string;
    name: string;
    city: string;
  };
}

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get("vendorId");

  const { itemsByVendor, clearVendorItems } = useCart();

  const [buyerName, setBuyerName] = React.useState("");
  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [buyerPhone, setBuyerPhone] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState<"PICKUP" | "CAMPUS_DELIVERY" | "SAFE_MEETUP_POINT">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [selectedMeetupPointId, setSelectedMeetupPointId] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Target vendor group
  const vendorIds = Object.keys(itemsByVendor);
  const selectedVendorId = vendorIdParam || vendorIds[0];
  const group = selectedVendorId ? itemsByVendor[selectedVendorId] : null;

  // Remote vendor & safe meetup points state
  const [vendorMeta, setVendorMeta] = React.useState<VendorMeta | null>(null);
  const [meetupPoints, setMeetupPoints] = React.useState<SafeMeetupPoint[]>([]);
  const [fetchingMeta, setFetchingMeta] = React.useState(false);

  React.useEffect(() => {
    if (!group?.vendor.id) return;

    let cancelled = false;
    setFetchingMeta(true);

    fetch(`/api/safe-meetup-points?vendorId=${encodeURIComponent(group.vendor.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.vendor) {
          setVendorMeta(data.vendor);
          if (data.vendor.sellerType === "guest") {
            setDeliveryMethod("SAFE_MEETUP_POINT");
          }
        }
        if (Array.isArray(data.meetupPoints)) {
          setMeetupPoints(data.meetupPoints);
          if (data.meetupPoints.length > 0 && !selectedMeetupPointId) {
            setSelectedMeetupPointId(data.meetupPoints[0].id);
            setDeliveryAddress(`${data.meetupPoints[0].name} - ${data.meetupPoints[0].description || ""}`.trim());
          }
        }
      })
      .catch((err) => console.error("Failed to load meetup points", err))
      .finally(() => {
        if (!cancelled) setFetchingMeta(false);
      });

    return () => {
      cancelled = true;
    };
  }, [group?.vendor.id]);

  const isGuestSeller =
    vendorMeta?.sellerType === "guest" || group?.vendor?.sellerType === "guest";
  const verificationTier =
    vendorMeta?.verificationTier ?? group?.vendor?.verificationTier ?? 1;

  // Check Tier 1 cap
  const isTier1Capped =
    isGuestSeller && verificationTier < 2 && (group?.subtotal || 0) > 10000;

  const handleSelectMeetupPoint = (point: SafeMeetupPoint) => {
    setSelectedMeetupPointId(point.id);
    setDeliveryAddress(`${point.name} - ${point.description || ""}`.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    if (isTier1Capped) {
      setError("Orders from Tier 1 Guest Vendors are capped at ₦10,000 for buyer security. Please adjust your order.");
      return;
    }

    if (isGuestSeller && !selectedMeetupPointId) {
      setError("Please select a safe campus meetup point for this guest seller order.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        buyerName,
        buyerEmail,
        buyerPhone,
        deliveryMethod: isGuestSeller ? "SAFE_MEETUP_POINT" : deliveryMethod,
        deliveryAddress: isGuestSeller
          ? (deliveryAddress || (meetupPoints.find((m) => m.id === selectedMeetupPointId)?.name ?? "Campus Safe Point"))
          : deliveryAddress,
        meetupPointId: isGuestSeller ? selectedMeetupPointId : null,
        vendorId: group.vendor.id,
        notes,
        items: group.items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit order request");
      }

      // Clear the items belonging to this vendor from the cart
      clearVendorItems(group.vendor.id);

      // Redirect to Order Success page
      router.push(`/order-success/${data.order.orderNumber}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong while placing your order request.");
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
        <h2 className="text-xl font-bold text-neutral-900">No Items to Check Out</h2>
        <p className="text-xs text-neutral-500">Your selected vendor items are empty or already ordered.</p>
        <Link href="/cart">
          <Button variant="outline" size="sm">
            &larr; Back to Bag
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-2 mb-6 text-xs text-neutral-500">
        <Link href="/cart" className="hover:text-neutral-900 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-bold">Order Request Checkout</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Buyer Details Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isGuestSeller ? (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-bold flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    Guest Vendor Order
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
                {isGuestSeller ? "Campus Safe Meetup & Contact Info" : "Student Contact & Pickup Info"}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Ordering from <strong>{group.vendor.storeName}</strong> ({group.vendor.campus?.name})
              </p>
            </div>

            {/* Guest Vendor Protection Banner */}
            {isGuestSeller && (
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-1.5 text-xs text-purple-900">
                <div className="flex items-center gap-2 font-bold text-purple-950">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  Designated Campus Meetup Required
                </div>
                <p className="text-[11px] leading-relaxed text-purple-800">
                  This vendor is an off-campus <strong>Guest Trader</strong>. For student safety and platform escrow guarantee, delivery must occur at one of the official university designated safe meetup points selected below.
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
                  Orders from newly registered Tier 1 Guest Vendors are capped at <strong>₦10,000</strong> for security. Your cart total is <strong>{formatNGN(group.subtotal)}</strong>. Please reduce item quantity or order from a verified Tier 2+ seller.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Your Full Name</label>
                <Input
                  required
                  placeholder="e.g. Demilade Johnson"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">WhatsApp / Phone Number</label>
                  <Input
                    type="tel"
                    required
                    placeholder="+234 801 234 5678"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Email Address</label>
                  <Input
                    type="email"
                    required
                    placeholder="student@university.edu.ng"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Delivery / Pickup Choice */}
              {isGuestSeller ? (
                /* GUEST VENDOR: Safe Meetup Point Selection */
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      Select Campus Safe Meetup Point
                    </label>
                    <span className="text-[10px] text-purple-700 font-semibold uppercase tracking-wider">
                      Mandatory for Guests
                    </span>
                  </div>

                  {meetupPoints.length === 0 ? (
                    <div className="p-4 rounded-xl bg-neutral-100 text-xs text-neutral-600">
                      Standard Safe Campus Location (Main Campus Gate / Student Center)
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {meetupPoints.map((point) => (
                        <label
                          key={point.id}
                          onClick={() => handleSelectMeetupPoint(point)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                            selectedMeetupPointId === point.id
                              ? "border-purple-600 bg-purple-50/50 shadow-xs"
                              : "border-neutral-200 hover:border-neutral-300 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="meetupPoint"
                            checked={selectedMeetupPointId === point.id}
                            onChange={() => handleSelectMeetupPoint(point)}
                            className="mt-0.5 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="space-y-0.5 text-xs">
                            <span className="font-bold text-neutral-950 block">{point.name}</span>
                            {point.description && (
                              <span className="text-neutral-500 text-[11px] block leading-tight">
                                {point.description}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* STUDENT VENDOR: Standard Delivery / Pickup Choice */
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
                        <span className="font-bold text-xs text-neutral-900">Campus Hub Pickup</span>
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
                        <span className="font-bold text-xs text-neutral-900">Hostel Delivery</span>
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
                <label className="text-xs font-bold text-neutral-700">Special Notes for Vendor (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                  placeholder="e.g. Available after 2 PM lectures on Tuesday..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading || isTier1Capped}
                  className={`w-full h-12 text-white font-bold rounded-2xl shadow-lg text-sm transition-all ${
                    isGuestSeller
                      ? "bg-purple-700 hover:bg-purple-800 shadow-purple-700/25"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                  }`}
                >
                  {loading
                    ? "Submitting Order Request..."
                    : `Submit Order Request (${formatNGN(group.subtotal)}) &rarr;`}
                </Button>
                <p className="text-center text-[11px] text-neutral-400 mt-2">
                  No online payment is charged right now. You inspect items in person before finalizing.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>Order Summary ({group.items.length} items)</span>
              {isGuestSeller ? (
                <span className="text-[11px] text-purple-700 font-semibold">Guest Seller</span>
              ) : (
                <span className="text-[11px] text-emerald-700 font-semibold">Student Seller</span>
              )}
            </h3>

            <div className="space-y-3 divide-y divide-neutral-100">
              {group.items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <img
                      src={item.image}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-200"
                    />
                    <div className="truncate">
                      <p className="font-bold text-neutral-900 truncate">{item.title}</p>
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

            <div className="pt-3 border-t border-neutral-200/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-800">{formatNGN(group.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Safe Campus Inspection</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Escrow Hold Fee</span>
                <span className="text-emerald-700 font-bold">₦0</span>
              </div>
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-base font-extrabold text-neutral-950">
                <span>Total Due on Pickup</span>
                <span className={isGuestSeller ? "text-purple-700" : "text-emerald-600"}>
                  {formatNGN(group.subtotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-neutral-100/70 text-xs text-neutral-600 space-y-2">
            <p className="font-bold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {isGuestSeller ? "Campus Safe Meetup Guarantee" : "Verified Student Protection"}
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              {isGuestSeller ? (
                <>
                  Your order is protected under campus trade safeguards. Meet vendor <strong>{group.vendor.storeName}</strong> strictly at the selected university safe zone. You will receive an immediate WhatsApp confirmation link upon submission.
                </>
              ) : (
                <>
                  Your order notification will be sent to <strong>{group.vendor.storeName}</strong>. You will receive an immediate WhatsApp confirmation link to communicate directly with the student seller.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50">
      <React.Suspense fallback={<div className="p-12 text-center text-xs text-neutral-500">Loading checkout...</div>}>
        <CheckoutForm />
      </React.Suspense>
    </div>
  );
}
