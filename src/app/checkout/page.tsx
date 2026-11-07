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
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";

export const dynamic = "force-dynamic";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get("vendorId");

  const { itemsByVendor, clearVendorItems } = useCart();

  const [buyerName, setBuyerName] = React.useState("");
  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [buyerPhone, setBuyerPhone] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState<"PICKUP" | "CAMPUS_DELIVERY">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Select target vendor group (either specified by query or the first vendor group in cart)
  const vendorIds = Object.keys(itemsByVendor);
  const selectedVendorId = vendorIdParam || vendorIds[0];
  const group = selectedVendorId ? itemsByVendor[selectedVendorId] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        buyerName,
        buyerEmail,
        buyerPhone,
        deliveryMethod,
        deliveryAddress,
        notes,
        vendorId: group.vendor.id,
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
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold">
                  On-Campus Fulfillment
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 mt-1">
                Student Contact & Pickup Info
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Ordering from <strong>{group.vendor.storeName}</strong> ({group.vendor.campus?.name})
              </p>
            </div>

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
              </div>

              <div className="space-y-1.5">
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
                  disabled={loading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 text-sm"
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
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
              Order Summary ({group.items.length} items)
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
                <span>On-Campus Inspection</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Platform Convenience Fee</span>
                <span className="text-emerald-700 font-bold">₦0</span>
              </div>
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-base font-extrabold text-neutral-950">
                <span>Total Due on Pickup</span>
                <span className="text-emerald-600">{formatNGN(group.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-neutral-100/70 text-xs text-neutral-600 space-y-2">
            <p className="font-bold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Student Protection
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              Your order notification will be sent to <strong>{group.vendor.storeName}</strong>. You will receive an immediate WhatsApp confirmation link to communicate directly with the seller.
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
