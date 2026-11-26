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
  Lock,
  Zap,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";
import {
  FlutterwaveLockedModal,
  ExistingOrderPayload,
} from "@/components/marketplace/FlutterwaveLockedModal";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

function InspectionCountdown({ deadline }: { deadline: string | Date }) {
  const [timeLeft, setTimeLeft] = React.useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  React.useEffect(() => {
    const target = new Date(deadline).getTime();

    const updateTimer = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft.isExpired) {
    return (
      <div className="text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Inspection Window Concluded (48h Elapsed)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm border border-blue-200 shadow-2xs">
        <Clock className="w-4 h-4 text-blue-700 animate-pulse" />
        <span>
          {String(timeLeft.hours).padStart(2, "0")}h {String(timeLeft.minutes).padStart(2, "0")}m {String(timeLeft.seconds).padStart(2, "0")}s
        </span>
      </div>
      <span className="text-[11px] font-semibold text-blue-800">
        remaining to inspect items &amp; open disputes
      </span>
    </div>
  );
}

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

  // Flutterwave Live Locked & Modal State (Dynamic Admin Controlled)
  const [lockedModalOpen, setLockedModalOpen] = React.useState(false);
  const { isFlutterwaveLocked } = usePlatformSettings();

  const handleCompletePayment = async () => {
    if (!order) return;
    if (isFlutterwaveLocked) {
      setLockedModalOpen(true);
      return;
    }
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

  const [deleting, setDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDeleteOrder = async () => {
    if (!order) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete order");
      }
      router.push("/orders");
    } catch (err: any) {
      console.error("Delete order error:", err);
      alert(err.message || "Failed to delete order. Please try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
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
          <p className="text-xs text-neutral-500">Loading order status...</p>
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
          <p className="text-xs text-neutral-500">{error || "Could not find this order."}</p>
          <Link href="/shop">
            <Button variant="outline" size="sm" className="rounded-xl">
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isEscrow = order.escrow_mode === "escrow";
  const escrowStatus = order.escrow_status || "pending";
  const isUnpaid =
    !order.paid_at &&
    escrowStatus === "pending" &&
    order.status !== "CANCELLED";
  const isPaidHeld = escrowStatus === "paid_held";
  const isDelivered = order.status === "DELIVERED" || escrowStatus === "delivered";
  const isConfirmed = escrowStatus === "confirmed" || escrowStatus === "payout_pending" || escrowStatus === "released";
  const isReleased = escrowStatus === "released";
  const isDisputed = escrowStatus === "disputed";
  const isRefunded = escrowStatus === "refunded";

  const effectiveDeadline =
    order.dispute_deadline ||
    (order.delivered_at
      ? new Date(new Date(order.delivered_at).getTime() + 48 * 3600000).toISOString()
      : null);

  return (
    <div className="min-h-screen bg-neutral-50/70 py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link href="/shop" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight flex flex-wrap items-center gap-2.5">
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
              {isDelivered && !isDisputed && !isReleased && (
                <Badge className="bg-blue-100 text-blue-900 border-blue-200 text-xs font-bold">
                  Handover Verified • 48h Inspection
                </Badge>
              )}
              {isDisputed && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-bold">
                  Dispute Under Review
                </Badge>
              )}
              {isReleased && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                  Completed &amp; Released
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

          <div className="flex flex-wrap items-center gap-2">
            {isUnpaid && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={paying || deleting}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold text-xs rounded-xl gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleCompletePayment}
                  disabled={paying || deleting}
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
              </>
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

        {/* Unpaid Order Banner */}
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
                  This order was created without completing checkout payment. Complete your payment of <strong>{formatNGN(order.totalAmount)}</strong> now so funds are secured and the vendor can deliver your order.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={paying || deleting}
                className="border-rose-300 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-bold text-xs rounded-2xl h-11 px-4 gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Cancel &amp; Delete</span>
              </Button>

              <Button
                onClick={handleCompletePayment}
                disabled={paying || deleting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl h-11 px-5 shadow-lg shadow-emerald-600/30 flex-1 sm:flex-initial gap-2"
              >
                {paying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Flutterwave...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isFlutterwaveLocked
                        ? "Pay via Meetup / Online Status →"
                        : "Complete Order & Pay Now →"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-neutral-900">
                  Delete Unpaid Order #{order.orderNumber}?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  This order was never paid for ({formatNGN(order.totalAmount)}). Deleting it will restore the vendor&apos;s product inventory and remove the order from your account.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="rounded-xl text-xs font-bold"
                >
                  Keep Order
                </Button>
                <Button
                  size="sm"
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm shadow-rose-600/30"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete Order</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Disputed State Alert Banner */}
        {isDisputed && (
          <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-sm text-amber-950">
                Escrow Dispute Active — Payout Locked
              </h3>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              You opened an escrow dispute for this order. Escrow payout to the vendor is strictly frozen. A platform mediator is reviewing the provided documentation and will contact both parties within 24 hours to issue a resolution.
            </p>
          </div>
        )}

        {/* 1. Order Lifecycle Timeline */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-extrabold text-sm text-neutral-900 flex items-center gap-2">
              {isEscrow ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <Zap className="w-4 h-4 text-neutral-600" />
              )}
              <span>{isEscrow ? "Escrow Order Lifecycle" : "Direct Order Lifecycle"}</span>
            </h3>
            {isEscrow ? (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Escrow Protected
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                Direct Settlement
              </span>
            )}
          </div>

          {isEscrow ? (
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
                  <span className="text-xs font-bold">3. Handover Code</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-neutral-600 leading-snug">
                  {isDelivered
                    ? "Handover code verified by vendor."
                    : "Provide your 6-digit code after verifying item condition."}
                </p>
              </div>

              {/* Step 4: Released */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isReleased
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                  : isDelivered && !isDisputed
                  ? "bg-blue-50/60 border-blue-200 text-blue-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-400"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">4. Payout Release</span>
                  <Package className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-600 leading-snug">
                  {isReleased
                    ? "Vendor paid out successfully."
                    : isDelivered
                    ? "Releases after 48h inspection."
                    : "Held until delivery code is verified."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${!isUnpaid ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-neutral-50 border-neutral-200"}`}>
                <span className="text-xs font-bold block mb-1">1. Direct Payment</span>
                <p className="text-[11px] text-neutral-600">Paid directly to seller upon payment verification.</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDelivered ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-neutral-50 border-neutral-200"}`}>
                <span className="text-xs font-bold block mb-1">2. Fulfillment</span>
                <p className="text-[11px] text-neutral-600">Vendor prepares and delivers items to pickup location.</p>
              </div>
              <div className={`p-4 rounded-2xl border ${order.status === "DELIVERED" ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-neutral-50 border-neutral-200"}`}>
                <span className="text-xs font-bold block mb-1">3. Completed</span>
                <p className="text-[11px] text-neutral-600">Order handed over and finished.</p>
              </div>
            </div>
          )}
        </div>

        {/* 2. One-Time 6-Digit Delivery Code Box (Shown when paid & handover pending) */}
        {isEscrow && isPaidHeld && !isDelivered && (
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
                  Keep this code private. <strong>Only give this code to the vendor in person AFTER you have thoroughly inspected the item</strong> at the meetup spot and are fully satisfied.
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
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                  title="Copy Code"
                >
                  {codeCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Fraud Advisory:</strong> Never share this code over chat, WhatsApp, or phone before seeing the item. Once the seller enters your code, handover is confirmed.
              </span>
            </div>
          </div>
        )}

        {/* 3. 48-Hour Inspection Window Card (Shown once handover code is verified) */}
        {isEscrow && isDelivered && !isDisputed && !isReleased && effectiveDeadline && (
          <div className="bg-gradient-to-br from-blue-50 via-white to-sky-50 rounded-3xl border-2 border-blue-400 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    Handover Confirmed • Inspection Window
                  </span>
                </div>
                <h3 className="text-xl font-black text-neutral-950">
                  48-Hour Buyer Inspection Period
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed max-w-xl">
                  Your delivery code was verified. You have a full 48-hour inspection period starting from handover to test your item and ensure it matches the description.
                </p>
              </div>

              {/* Live Inspection Countdown */}
              <InspectionCountdown deadline={effectiveDeadline} />
            </div>

            <div className="pt-2 border-t border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <p className="text-neutral-500 text-[11px]">
                If the item has defects or issues, open a dispute before the timer expires to freeze payment release.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisputeModalOpen(true)}
                className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl shrink-0 cursor-pointer"
              >
                Open Dispute / Report Issue
              </Button>
            </div>
          </div>
        )}

        {/* 4. Order Items & Meetup Details */}
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

            {/* Complete Itemized Price Breakdown */}
            <div className="pt-4 border-t border-neutral-100 space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-neutral-900">{formatNGN(order.subtotal || order.totalAmount)}</span>
              </div>
              {order.fee_amount > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Escrow Protection Fee ({order.fee_percent || 0}%):</span>
                  <span className="font-semibold text-emerald-700">+{formatNGN(order.fee_amount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-100 flex justify-between items-center text-sm">
                <span className="font-bold text-neutral-800">Total Paid:</span>
                <span className="text-base font-extrabold text-neutral-950">
                  {formatNGN(order.totalAmount)}
                </span>
              </div>
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
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Student Buyer School:</span>
                <p className="font-semibold text-neutral-800 mt-0.5">
                  {order.buyerCampus?.name || (order.vendor?.campus?.name ? order.vendor.campus.name : "Campus Student")}
                </p>
                {order.buyerCampus?.city && (
                  <p className="text-[11px] text-neutral-500">
                    {order.buyerCampus.city}
                  </p>
                )}
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

              {/* Dispute Button (Available if escrow mode, before 48h elapsed, and not yet disputed/refunded) */}
              {isEscrow && !isDisputed && !isRefunded && (
                <div className="pt-4 border-t border-neutral-100 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisputeModalOpen(true)}
                    className="w-full text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
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

      {/* Improvised Professional Modal when Flutterwave is clicked / locked */}
      <FlutterwaveLockedModal
        isOpen={lockedModalOpen}
        onClose={() => setLockedModalOpen(false)}
        existingOrder={
          order
            ? {
                orderId: order.id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                vendorStoreName: order.vendor.storeName,
                vendorWhatsApp: order.vendor.whatsapp,
                deliveryAddress: order.deliveryAddress,
              }
            : null
        }
      />
    </div>
  );
}
