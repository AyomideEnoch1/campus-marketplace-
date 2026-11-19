"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  MessageSquare,
  Copy,
  Check,
  ArrowLeft,
  X,
  AlertCircle,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = React.useState<any>(null);
  const [deliveryCode, setDeliveryCode] = React.useState<string | null>(null);
  const [codeLoading, setCodeLoading] = React.useState(true);
  const [codeCopied, setCodeCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paying, setPaying] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  const handleCompletePayment = async () => {
    if (!order) return;
    try {
      setPaying(true);
      setPaymentError(null);
      const res = await fetch("/api/payments/pay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate payment");
      }
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        throw new Error("No payment link returned from server");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentError(
        err.message || "Failed to start payment. Please try again."
      );
    } finally {
      setPaying(false);
    }
  };

  // Dispute modal state
  const [disputeModalOpen, setDisputeModalOpen] = React.useState(false);
  const [disputeReason, setDisputeReason] = React.useState("ITEM_NOT_AS_DESCRIBED");
  const [disputeDescription, setDisputeDescription] = React.useState("");
  const [disputeSubmitting, setDisputeSubmitting] = React.useState(false);
  const [disputeSuccess, setDisputeSuccess] = React.useState(false);

  // Fetch Order
  const fetchOrder = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error("Failed to load order");
      }
      const data = await res.json();
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Fetch Delivery Code
  const fetchCode = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/escrow/delivery-code?orderId=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setDeliveryCode(data.code);
      }
    } catch (err) {
      console.warn("Could not fetch delivery code:", err);
    } finally {
      setCodeLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchCode();
    }
  }, [orderId, fetchOrder, fetchCode]);

  const handleCopyCode = () => {
    if (!deliveryCode) return;
    navigator.clipboard.writeText(deliveryCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeSubmitting(true);
    try {
      const res = await fetch("/api/disputes/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          reason: disputeReason,
          description: disputeDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to open dispute");
      }

      setDisputeSuccess(true);
      setDisputeModalOpen(false);
      fetchOrder();
    } catch (err: any) {
      alert(err.message || "Failed to submit dispute");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500">Loading escrow order status...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Order Not Found</h2>
          <p className="text-xs text-neutral-500">{error || "Could not find this escrow order."}</p>
          <Link href="/shop">
            <Button variant="outline" size="sm" className="rounded-xl">
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const escrowStatus = order.escrow_status || "pending";
  const isUnpaid =
    !order.paid_at &&
    escrowStatus === "pending" &&
    order.status !== "CANCELLED";
  const isPaidHeld = escrowStatus === "paid_held";
  const isDelivered = escrowStatus === "delivered";
  const isConfirmed = escrowStatus === "confirmed" || escrowStatus === "payout_pending" || escrowStatus === "released";
  const isDisputed = escrowStatus === "disputed";
  const isRefunded = escrowStatus === "refunded";

  return (
    <div className="min-h-screen bg-neutral-50/70 py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link href="/shop" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight flex items-center gap-3">
              <span>Order #{order.orderNumber}</span>
              {isUnpaid && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-bold">
                  Payment Pending
                </Badge>
              )}
              {isPaidHeld && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                  Funds Held in Escrow
                </Badge>
              )}
              {isDisputed && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-bold">
                  Dispute Under Review
                </Badge>
              )}
              {isRefunded && (
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-xs font-bold">
                  Refunded
                </Badge>
              )}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isUnpaid && (
              <Button
                size="sm"
                onClick={handleCompletePayment}
                disabled={paying}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-md shadow-emerald-600/30"
              >
                {paying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Complete Order &amp; Pay</span>
                  </>
                )}
              </Button>
            )}

            <Link
              href={`/messages?vendor=${order.vendor?.slug || order.vendor?.id || ""}${order.items?.[0]?.productId ? `&product=${order.items[0].productId}` : ""}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Vendor</span>
            </Link>
          </div>
        </div>

        {paymentError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{paymentError}</span>
            </div>
            <button
              onClick={() => setPaymentError(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-bold underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {isUnpaid && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-amber-950">
                    Payment Pending for Order #{order.orderNumber}
                  </h3>
                  <Badge className="bg-amber-200/90 text-amber-950 border-amber-400 text-[10px] font-black uppercase">
                    Action Required
                  </Badge>
                </div>
                <p className="text-xs text-amber-800/90 leading-relaxed max-w-xl">
                  This order was created without completing payment. Complete your payment of <strong>{formatNGN(order.totalAmount)}</strong> now so funds are secured in platform escrow and the vendor can deliver your order.
                </p>
              </div>
            </div>

            <Button
              onClick={handleCompletePayment}
              disabled={paying}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl h-11 px-5 shadow-lg shadow-emerald-600/30 shrink-0 w-full sm:w-auto gap-2"
            >
              {paying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to Flutterwave...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Complete Order &amp; Pay Now &rarr;</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* 1. Escrow Status Timeline */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Escrow Order Lifecycle</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Escrow Protected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {/* Step 1: Paid & Held */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isPaidHeld || isDelivered || isConfirmed
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                : "bg-neutral-50 border-neutral-200 text-neutral-400"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">1. Payment Held</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                Funds safely deposited into platform escrow.
              </p>
            </div>

            {/* Step 2: Safe Meetup */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isPaidHeld || isDelivered || isConfirmed
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                : "bg-neutral-50 border-neutral-200 text-neutral-400"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">2. Meet &amp; Inspect</span>
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                Meet vendor at designated safe meetup point.
              </p>
            </div>

            {/* Step 3: Delivery Code */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isDelivered || isConfirmed
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                : isPaidHeld
                ? "bg-amber-50/80 border-amber-300 text-amber-950 ring-2 ring-amber-400/20"
                : "bg-neutral-50 border-neutral-200 text-neutral-400"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">3. Delivery Code</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                Provide your 6-digit code after verifying item condition.
              </p>
            </div>

            {/* Step 4: Released */}
            <div className={`p-4 rounded-2xl border transition-all ${
              escrowStatus === "released"
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                : "bg-neutral-50 border-neutral-200 text-neutral-400"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">4. Payout Released</span>
                <Package className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-[11px] text-neutral-600 leading-snug">
                {escrowStatus === "released"
                  ? "Vendor paid out successfully."
                  : "Held until delivery code is verified."}
              </p>
            </div>
          </div>
        </div>

        {/* 2. One-Time 6-Digit Delivery Code Box */}
        {(isPaidHeld || isDelivered) && (
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  One-Time Delivery Confirmation Code
                </span>
                <h3 className="text-xl font-black text-neutral-950 mt-1">
                  Your 6-Digit Hand-Off Code
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-xl mt-0.5">
                  Keep this code private. <strong>Only give this code to the vendor in person AFTER you have thoroughly inspected the item</strong> and are fully satisfied.
                </p>
              </div>

              {/* Code Display Box */}
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border-2 border-emerald-500 shadow-md">
                <span className="font-mono text-3xl font-black tracking-widest text-emerald-700">
                  {codeLoading ? "••••••" : deliveryCode || "••••••"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
                  title="Copy Code"
                >
                  {codeCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Fraud Advisory:</strong> Never share this code over chat, WhatsApp, or phone before seeing the item. Once the seller enters your code, the order is verified and funds will be released to their bank account.
              </span>
            </div>
          </div>
        )}

        {/* 3. Order Items & Meetup Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
              Items Ordered ({order.items?.length || 0})
            </h3>

            <div className="space-y-3 divide-y divide-neutral-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-lg shrink-0">
                      📦
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900">{item.product?.title || "Campus Item"}</p>
                      <p className="text-neutral-500 text-[11px]">
                        Qty: {item.quantity} &times; {formatNGN(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900">
                    {formatNGN(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-between items-center text-sm">
              <span className="font-bold text-neutral-700">Total Escrow Amount:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {formatNGN(order.subtotal || order.totalAmount)}
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
              Meetup Point &amp; Vendor
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Safe Meetup Point:</span>
                <p className="font-semibold text-neutral-800 mt-0.5">
                  {order.deliveryAddress || "Campus Safe Spot"}
                </p>
              </div>

              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Vendor Store:</span>
                <p className="font-semibold text-neutral-800 mt-0.5">
                  {order.vendor?.storeName || "Campus Vendor"}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {order.vendor?.campus?.name || "University Campus"}
                </p>
              </div>

              {/* Dispute Button (Available if delivered or confirmed, before 48h) */}
              {!isDisputed && !isRefunded && (
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisputeModalOpen(true)}
                    className="w-full text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Open Dispute / Report Issue
                  </Button>
                  <p className="text-[10px] text-neutral-400 text-center">
                    Disputes freeze escrow funds immediately
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Dispute Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-neutral-950 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Open an Escrow Dispute</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Order #{order.orderNumber} &bull; Funds will be frozen in escrow
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenDispute} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">Reason for Dispute:</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="ITEM_NOT_AS_DESCRIBED">Item condition not as described</option>
                  <option value="DEFECTIVE_OR_DAMAGED">Item is damaged or defective</option>
                  <option value="VENDOR_NO_SHOW">Vendor failed to meet at agreed meetup point</option>
                  <option value="WRONG_ITEM_DELIVERED">Completely different product delivered</option>
                  <option value="OTHER">Other issue</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">Detailed Explanation:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what occurred during the meetup or item inspection..."
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600">
                🔒 Once submitted, escrow funds remain locked. A platform mediator will review the case within 24 hours to issue a refund or release.
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={disputeSubmitting}
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {disputeSubmitting ? "Submitting Dispute..." : "Freeze Funds & Submit Dispute"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDisputeModalOpen(false)}
                  className="rounded-xl border-neutral-300 text-neutral-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
