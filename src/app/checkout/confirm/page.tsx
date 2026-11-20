"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Package,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function CheckoutConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const txRef = searchParams.get("tx_ref") || searchParams.get("txRef");
  const transactionId = searchParams.get("transaction_id") || searchParams.get("flw_ref");
  const rawStatus = searchParams.get("status");

  const [loading, setLoading] = React.useState(true);
  const [orderStatus, setOrderStatus] = React.useState<string>("checking");
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [pollCount, setPollCount] = React.useState(0);
  const [paying, setPaying] = React.useState(false);
  const [retryError, setRetryError] = React.useState<string | null>(null);

  const handleRetryPayment = async () => {
    if (!orderId && !txRef) return;
    try {
      setPaying(true);
      setRetryError(null);
      const res = await fetch("/api/payments/pay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId || undefined,
          orderNumber: txRef || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initiate payment retry");
      }
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    } catch (err: any) {
      setRetryError(err.message || "Failed to open payment gateway.");
    } finally {
      setPaying(false);
    }
  };

  // Verification routine
  const checkStatus = React.useCallback(async () => {
    if (!txRef && !transactionId) {
      setLoading(false);
      setErrorMessage("No transaction reference found in payment callback.");
      return;
    }

    try {
      const query = new URLSearchParams();
      if (txRef) query.set("tx_ref", txRef);
      if (transactionId) query.set("transaction_id", transactionId);
      if (rawStatus) query.set("status", rawStatus);

      const res = await fetch(`/api/payments/verify-payment?${query.toString()}`);
      const data = await res.json();

      if (data.orderId) {
        setOrderId(data.orderId);
      }

      if (res.ok && (data.status === "paid_held" || data.status === "confirmed" || data.status === "delivered" || data.status === "released")) {
        setOrderStatus(data.status);
        setLoading(false);
        return true;
      } else if (!res.ok && data.error) {
        // Keep polling if transaction is still processing on Flutterwave
        if (pollCount > 10) {
          setLoading(false);
          setErrorMessage(data.message || data.error);
        }
      }
    } catch (err: any) {
      if (pollCount > 10) {
        setLoading(false);
        setErrorMessage(err.message || "Failed to verify transaction status.");
      }
    }
    return false;
  }, [txRef, transactionId, rawStatus, pollCount]);

  // Initial check & polling interval
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    checkStatus().then((isDone) => {
      if (!isDone) {
        interval = setInterval(async () => {
          setPollCount((prev) => prev + 1);
          const done = await checkStatus();
          if (done) clearInterval(interval);
        }, 3000);
      }
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkStatus]);

  const isSuccess =
    orderStatus === "paid_held" ||
    orderStatus === "confirmed" ||
    orderStatus === "delivered" ||
    orderStatus === "released";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4 bg-neutral-50/70">
      <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200/90 shadow-xl p-8 sm:p-10 text-center space-y-6 animate-in fade-in-50 zoom-in-95">
        
        {loading && (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-neutral-900">Verifying Escrow Payment...</h2>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
              Confirming transaction with Flutterwave and securing your funds in platform escrow.
            </p>
          </div>
        )}

        {!loading && isSuccess && (
          <div className="space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-neutral-950 tracking-tight pt-1">
                Order Paid &amp; Protected!
              </h1>
              <p className="text-xs text-neutral-600 leading-relaxed pt-1">
                Your payment has been received and is safely held in ọjà Escrow. The vendor will <strong>not</strong> receive payment until you meet, inspect, and confirm your delivery code.
              </p>
            </div>

            {txRef && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-left space-y-1 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Reference:</span>
                  <span className="font-mono font-bold text-neutral-900">{txRef}</span>
                </div>
                {transactionId && (
                  <div className="flex justify-between text-neutral-500">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-neutral-800">{transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500">
                  <span>Status:</span>
                  <span className="text-emerald-700 font-bold uppercase">PAID &bull; HELD IN ESCROW</span>
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <Link href={orderId ? `/orders/${orderId}` : "/shop"} className="block">
                <Button size="lg" className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md gap-2">
                  <Package className="w-4 h-4" />
                  <span>Track Order &amp; View Delivery Code</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/shop" className="block">
                <Button variant="outline" className="w-full h-11 rounded-2xl border-neutral-300 text-xs font-semibold text-neutral-700">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!loading && !isSuccess && (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-neutral-900">
                Payment Not Completed
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {errorMessage ||
                  "Your order request has been safely saved, but payment was not finalized. No funds have been debited."}
              </p>
            </div>

            {retryError && (
              <p className="text-xs text-rose-600 font-medium">{retryError}</p>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              {(orderId || txRef) && (
                <Button
                  onClick={handleRetryPayment}
                  disabled={paying}
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-11 gap-2 shadow-md shadow-emerald-600/20"
                >
                  {paying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Opening Payment Gateway...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Complete Order &amp; Pay Now</span>
                    </>
                  )}
                </Button>
              )}

              <Link href="/orders" className="block">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl text-xs font-bold border-neutral-300 text-neutral-800"
                >
                  View in My Orders
                </Button>
              </Link>

              <Button
                onClick={() => {
                  setLoading(true);
                  setPollCount(0);
                  checkStatus();
                }}
                variant="ghost"
                className="rounded-2xl text-xs font-medium text-neutral-600 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-check Payment Status
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function CheckoutConfirmPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-pulse">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-neutral-500">Loading payment confirmation...</p>
          </div>
        </div>
      }
    >
      <CheckoutConfirmContent />
    </React.Suspense>
  );
}
