"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
  MapPin,
  Store,
  CreditCard,
  MessageSquare,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";

export interface CheckoutDataPayload {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryMethod: "PICKUP" | "CAMPUS_DELIVERY" | "SAFE_MEETUP_POINT";
  deliveryAddress: string;
  meetupPointId?: string | null;
  vendorId: string;
  vendorName?: string;
  vendorWhatsApp?: string | null;
  notes?: string;
  totalAmount: number;
  items: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
}

export interface ExistingOrderPayload {
  orderId?: string;
  orderNumber: string;
  totalAmount: number;
  vendorStoreName: string;
  vendorWhatsApp?: string | null;
  deliveryAddress?: string;
}

export interface FlutterwaveLockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutData?: CheckoutDataPayload | null;
  existingOrder?: ExistingOrderPayload | null;
  onOrderPlaced?: (orderNumber: string) => void;
}

export function FlutterwaveLockedModal({
  isOpen,
  onClose,
  checkoutData,
  existingOrder,
  onOrderPlaced,
}: FlutterwaveLockedModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showAdminDetails, setShowAdminDetails] = React.useState(false);

  // Close on ESC key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  React.useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPayable = checkoutData
    ? checkoutData.totalAmount
    : existingOrder
    ? existingOrder.totalAmount
    : 0;

  const vendorName =
    checkoutData?.vendorName ||
    existingOrder?.vendorStoreName ||
    "Campus Vendor";

  const vendorId = checkoutData?.vendorId || "";
  const inAppChatUrl = vendorId ? `/messages?vendor=${vendorId}` : "/messages";

  // Handler for placing offline / pay-on-meetup order directly from modal
  const handlePlaceMeetupOrder = async () => {
    if (!checkoutData) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        buyerName: checkoutData.buyerName,
        buyerEmail: checkoutData.buyerEmail,
        buyerPhone: checkoutData.buyerPhone,
        deliveryMethod: checkoutData.deliveryMethod,
        deliveryAddress: checkoutData.deliveryAddress,
        meetupPointId: checkoutData.meetupPointId || null,
        vendorId: checkoutData.vendorId,
        notes: checkoutData.notes || null,
        items: checkoutData.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit order request");
      }

      const orderNumber = data.order?.orderNumber;

      if (onOrderPlaced && orderNumber) {
        onOrderPlaced(orderNumber);
      } else if (orderNumber) {
        router.push(`/order-success/${orderNumber}`);
      } else {
        router.push("/orders");
      }
    } catch (err: any) {
      console.error("[Meetup Order Placement Error]:", err);
      setSubmitError(err.message || "Something went wrong creating your order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="flw-locked-title"
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl border border-neutral-200/90 p-5 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visual Header / Brand Accent */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          {/* Animated Lock + Shield Badge */}
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-300/60 flex items-center justify-center text-amber-700 shadow-inner">
              <Lock className="w-8 h-8 sm:w-9 sm:h-9 text-amber-600 drop-shadow-sm" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1.5 shadow-md border-2 border-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Feature Locked &bull; Live Gateway Onboarding</span>
            </div>

            <h2
              id="flw-locked-title"
              className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight"
            >
              Online Checkout is Temporarily Locked
            </h2>

            <p className="text-xs sm:text-[13px] text-neutral-600 max-w-md mx-auto leading-relaxed">
              Live automated debit card &amp; online bank transfers via{" "}
              <strong className="text-neutral-900 font-bold">Flutterwave</strong>{" "}
              are currently in compliance onboarding while our merchant credentials
              are finalized.
            </p>
          </div>
        </div>

        {/* Order or Cart Snapshot Banner */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-neutral-900 pb-2 border-b border-neutral-200/70">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>{vendorName}</span>
            </div>
            <span className="text-emerald-700 font-extrabold text-sm sm:text-base">
              {formatNGN(totalPayable)}
            </span>
          </div>

          {checkoutData?.deliveryAddress && (
            <div className="flex items-start gap-2 text-neutral-600 text-[11px] pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                Handover at: <strong>{checkoutData.deliveryAddress}</strong>
              </span>
            </div>
          )}

          {existingOrder && (
            <div className="flex items-center justify-between text-neutral-600 text-[11px] pt-0.5">
              <span>Order Reference:</span>
              <span className="font-mono font-bold text-neutral-900">
                #{existingOrder.orderNumber}
              </span>
            </div>
          )}
        </div>

        {/* Reassurance & Solution Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5 text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-bold text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>How to Complete Your Purchase Right Now:</span>
          </div>
          <ul className="space-y-2 text-[11px] text-emerald-900/90 leading-relaxed pl-1">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-700 shrink-0">&bull;</span>
              <span>
                <strong>Pay-on-Inspection / Delivery:</strong> Place this order
                with <strong>₦0 upfront card charges</strong>. Receive or inspect
                your items safely, and pay directly via instant transfer or cash!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-700 shrink-0">&bull;</span>
              <span>
                <strong>In-App Chat Messaging:</strong> Chat directly with the
                vendor inside the platform to confirm item availability and
                delivery details with zero phone number leakage.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-700 shrink-0">&bull;</span>
              <span>
                <strong>Zero Financial Risk:</strong> No unauthorized debits will
                occur on your card or bank account.
              </span>
            </li>
          </ul>
        </div>

        {submitError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Primary and Alternative CTA Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Action 1: Place Pay-on-Meetup Order (If from Checkout) */}
          {checkoutData && (
            <Button
              type="button"
              onClick={handlePlaceMeetupOrder}
              disabled={submitting}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/25 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirm & Place Order ({formatNGN(totalPayable)}) &rarr;
                  </span>
                </>
              )}
            </Button>
          )}

          {/* Action 2: Chat with Vendor In-App */}
          {inAppChatUrl && (
            <Link
              href={inAppChatUrl}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Chat with Vendor in App</span>
            </Link>
          )}

          {/* Action 3: Track Existing Order (If triggered on existing order) */}
          {existingOrder && (
            <Button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/orders/track/${existingOrder.orderNumber}`);
              }}
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Track Order #{existingOrder.orderNumber}</span>
            </Button>
          )}

          {/* Action 4: Dismiss */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="w-full h-10 border-neutral-200 text-neutral-600 hover:text-neutral-900 font-semibold rounded-2xl text-xs cursor-pointer"
          >
            Return to Cart &amp; Review Order
          </Button>
        </div>

        {/* Subtle Admin / Developer Information Toggle */}
        <div className="pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setShowAdminDetails(!showAdminDetails)}
            className="w-full flex items-center justify-between text-[11px] text-neutral-400 hover:text-neutral-600 font-medium py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Platform Developer / Admin Notice</span>
            </span>
            {showAdminDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showAdminDetails && (
            <div className="mt-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-[11px] text-neutral-600 space-y-1.5 animate-in fade-in duration-150">
              <p className="font-semibold text-neutral-800">
                Are you setting up Flutterwave credentials?
              </p>
              <p className="leading-relaxed">
                When your live production API keys (`FLW_SECRET_KEY` and
                `FLW_PUBLIC_KEY`) are activated on your Flutterwave dashboard, add
                them to `.env` and set:
              </p>
              <code className="block p-1.5 rounded bg-neutral-900 text-emerald-400 font-mono text-[10px]">
                NEXT_PUBLIC_FLUTTERWAVE_LOCKED="false"
              </code>
              <p className="text-[10px] text-neutral-400">
                This flag will immediately re-enable automated Flutterwave live
                hosted checkout redirection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
