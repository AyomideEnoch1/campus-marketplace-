"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Truck,
  MessageCircle,
  MessageSquare,
  ExternalLink,
  MapPin,
  Calendar,
  ShieldCheck,
  Package,
  Clock,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNGN, formatDate } from "@/lib/utils";
import { OrderMilestoneTracker } from "@/components/orders/OrderMilestoneTracker";

interface OrderTrackingClientProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    deliveryMethod: string;
    deliveryAddress: string;
    meetupPoint?: {
      id: string;
      name: string;
      description: string | null;
    } | null;
    notes?: string | null;
    paid_at?: string | Date | null;
    escrow_status?: string | null;
    escrow_mode?: string | null;
    tx_ref?: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    vendor: {
      id: string;
      storeName: string;
      slug: string;
      whatsapp?: string | null;
      sellerType?: string;
      isTrustedSeller?: boolean;
      isRegisteredBusiness?: boolean;
      campus?: {
        name: string;
        city: string;
      } | null;
    };
    items: {
      id: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      product: {
        id: string;
        title: string;
        slug?: string;
        images?: { url: string }[];
      };
    }[];
  };
}

export function OrderTrackingClient({ order }: OrderTrackingClientProps) {
  const isUnpaid =
    !order.paid_at &&
    order.escrow_status === "pending" &&
    order.status !== "CANCELLED";

  const [paying, setPaying] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  const handleCompletePayment = async () => {
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

  const whatsappMsg = `Hi ${order.vendor.storeName}, I am tracking my ọjà order #${order.orderNumber}. Can you give me an update on delivery to: ${order.deliveryAddress}?`;
  const whatsappUrl = order.vendor.whatsapp
    ? `https://wa.me/${order.vendor.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMsg)}`
    : null;

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20 pt-8 sm:pt-12">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/orders">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-neutral-600 hover:text-neutral-900 gap-1.5 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Orders</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {isUnpaid && (
              <Button
                size="sm"
                onClick={handleCompletePayment}
                disabled={paying}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-md shadow-emerald-600/30"
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

            <Link href={`/order-success/${order.orderNumber}`}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold rounded-xl gap-1.5 bg-white shadow-2xs"
              >
                <span>View Receipt</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Error message */}
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

        {/* Unpaid Order Alert Banner */}
        {isUnpaid && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-amber-950">
                    Order Placed Without Payment
                  </h3>
                  <Badge className="bg-amber-200/90 text-amber-950 border-amber-400 text-[10px] font-black uppercase">
                    Payment Pending
                  </Badge>
                </div>
                <p className="text-xs text-amber-800/90 leading-relaxed max-w-xl">
                  Your order is reserved in our system, but the vendor cannot fulfill or ship items until payment is confirmed in escrow. Click below to complete your payment of <strong>{formatNGN(order.totalAmount)}</strong> securely.
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

        {/* Tracking Header Card */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                  Track Campus Order
                </h1>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-2 font-mono">
                <span>Reference:</span>
                <strong className="text-neutral-900 font-bold">
                  #{order.orderNumber}
                </strong>
              </p>
            </div>

            {/* Direct In-App Chat button */}
            <Link
              href={`/messages?vendor=${order.vendor.slug || order.vendor.id}${order.items[0]?.productId ? `&product=${order.items[0].productId}` : ""}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Seller</span>
            </Link>
          </div>

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-neutral-400 block">Vendor Store:</span>
              <strong className="text-neutral-900 font-bold text-xs sm:text-sm block truncate">
                {order.vendor.storeName}
              </strong>
              {order.vendor.campus && (
                <span className="text-[11px] text-neutral-500">
                  {order.vendor.campus.name}
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <span className="text-neutral-400 block">Fulfillment Method:</span>
              <strong className="text-neutral-900 font-bold text-xs sm:text-sm block">
                {order.deliveryMethod === "SAFE_MEETUP_POINT"
                  ? "Safe Meetup Point"
                  : order.deliveryMethod}
              </strong>
              <span className="text-[11px] text-emerald-600 font-semibold">
                Campus Verified
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-neutral-400 block">Order Placed:</span>
              <strong className="text-neutral-900 font-bold text-xs sm:text-sm block">
                {formatDate(order.createdAt)}
              </strong>
              <span className="text-[11px] text-neutral-500">Direct Purchase</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-neutral-400 block">Total Amount:</span>
              <strong className="text-emerald-600 font-black text-sm sm:text-base block">
                {formatNGN(order.totalAmount)}
              </strong>
              <span className="text-[11px] text-neutral-500">
                {order.items.length} {order.items.length === 1 ? "Item" : "Items"}
              </span>
            </div>
          </div>
        </div>

        {/* Milestone Tracker Section */}
        <OrderMilestoneTracker order={order} />

        {/* Ordered Items Accordion Card */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h4 className="text-sm sm:text-base font-extrabold text-neutral-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Items in this Order ({order.items.length})</span>
            </h4>
            <span className="text-xs text-neutral-500">
              Total: <strong className="text-neutral-900">{formatNGN(order.totalAmount)}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => {
              const coverImg =
                item.product.images?.[0]?.url ||
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-neutral-50/70 border border-neutral-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl bg-neutral-200 overflow-hidden shrink-0">
                      <Image
                        src={coverImg}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-neutral-900 line-clamp-1">
                        {item.product.title}
                      </h5>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Qty: <strong>{item.quantity}</strong> × {formatNGN(item.unitPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-extrabold text-xs sm:text-sm text-neutral-900">
                    {formatNGN(item.unitPrice * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Destination & Safe Meetup Details */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-3">
          <h4 className="text-sm sm:text-base font-extrabold text-neutral-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Delivery & Meetup Location</span>
          </h4>
          <p className="text-xs text-neutral-600">
            Fulfillment Destination:{" "}
            <strong className="text-neutral-900">{order.deliveryAddress}</strong>
          </p>
          {order.meetupPoint && (
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 text-xs text-purple-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>📍 Designated Safe Meetup Zone:</span>
                <span>{order.meetupPoint.name}</span>
              </p>
              {order.meetupPoint.description && (
                <p className="text-[11px] text-purple-700">
                  {order.meetupPoint.description}
                </p>
              )}
            </div>
          )}
          {order.notes && (
            <div className="text-xs text-neutral-500 pt-1">
              <span>Order Note: </span>
              <span className="italic text-neutral-700">&ldquo;{order.notes}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Campus Safety Guarantee */}
        <div className="rounded-2xl bg-white border border-neutral-200/80 p-5 flex items-start gap-3.5 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-neutral-600">
            <p className="font-bold text-neutral-900">Campus Delivery Protection</p>
            <p>
              Always inspect your products when meeting the student seller or courier at designated public zones. Do not confirm receipt until you have inspected the items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
