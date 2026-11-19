"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Package,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNGN, formatDate } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images?: { url: string }[];
  };
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  buyerId?: string | null;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  deliveryAddress: string;
  deliveryMethod: string;
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  paid_at?: string | Date | null;
  escrow_status: string;
  escrow_mode: string;
  createdAt: string | Date;
  items?: OrderItem[];
}

interface VendorOrdersClientProps {
  initialOrders: OrderRecord[];
}

export function VendorOrdersClient({ initialOrders }: VendorOrdersClientProps) {
  const [orders, setOrders] = React.useState<OrderRecord[]>(initialOrders);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [filterTab, setFilterTab] = React.useState<"PAID" | "ALL" | "UNPAID" | "DELIVERED">("PAID");
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleUpdateStatus = async (orderId: string, newStatus: string, isPaid: boolean) => {
    if (newStatus === "DELIVERED" && !isPaid) {
      const confirmDeliverUnpaid = window.confirm(
        "⚠️ PAYMENT NOTICE:\n\nThis order is marked as UNPAID. The buyer has NOT completed payment yet.\n\nAre you sure you want to mark it as Delivered before payment is verified in escrow?"
      );
      if (!confirmDeliverUnpaid) return;
    }

    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const isOrderPaid = (order: OrderRecord) => {
    return Boolean(order.paid_at) || ["paid_held", "confirmed", "delivered", "released"].includes(order.escrow_status);
  };

  const paidCount = orders.filter((o) => isOrderPaid(o)).length;
  const unpaidCount = orders.filter((o) => !isOrderPaid(o) && o.status !== "CANCELLED").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  const filteredOrders = orders.filter((order) => {
    const paid = isOrderPaid(order);

    if (filterTab === "PAID" && !paid) return false;
    if (filterTab === "UNPAID" && (paid || order.status === "CANCELLED")) return false;
    if (filterTab === "DELIVERED" && order.status !== "DELIVERED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchBuyer = order.buyerName.toLowerCase().includes(q);
      const matchPhone = order.buyerPhone?.toLowerCase().includes(q);
      const matchItem = order.items?.some((i) => i.product?.title?.toLowerCase().includes(q));
      if (!matchNum && !matchBuyer && !matchPhone && !matchItem) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filtering and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100/80 rounded-2xl border border-neutral-200/80 overflow-x-auto text-xs">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterTab === "ALL"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            All Requests ({orders.length})
          </button>
          <button
            onClick={() => setFilterTab("PAID")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === "PAID"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Paid in Escrow ({paidCount})
          </button>
          <button
            onClick={() => setFilterTab("UNPAID")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === "UNPAID"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-amber-800 hover:bg-amber-50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Unpaid / Pending ({unpaidCount})
          </button>
          <button
            onClick={() => setFilterTab("DELIVERED")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterTab === "DELIVERED"
                ? "bg-neutral-900 text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Delivered ({deliveredCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by buyer, #ID, phone..."
            className="pl-9 h-9 text-xs rounded-xl bg-white border-neutral-200"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-neutral-200 bg-white p-8 space-y-3">
          <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-neutral-800">
            {orders.length === 0 ? "No Orders Received Yet" : "No Matching Orders Found"}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {orders.length === 0
              ? "When students on campus place orders or submit requests for your products, they will appear here with full payment and escrow indicators."
              : "Try switching filter tabs or clearing your search query."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const paid = isOrderPaid(order);
            const isReleased = order.escrow_status === "released";

            return (
              <div
                key={order.id}
                className={`p-5 rounded-3xl bg-white border transition-all space-y-4 ${
                  paid
                    ? "border-emerald-200/90 shadow-sm shadow-emerald-500/5"
                    : "border-amber-200/90 shadow-sm shadow-amber-500/5 bg-gradient-to-b from-amber-50/20 to-white"
                }`}
              >
                {/* Header: Order ID, Date, Payment Status & Fulfillment Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-neutral-100 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-neutral-900 text-sm">
                      #{order.orderNumber}
                    </span>

                    {/* PAYMENT STATUS BADGE (High Visibility) */}
                    {paid ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {isReleased ? "PAID • FUNDS RELEASED" : "PAID • HELD IN ESCROW"}
                        </span>
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border border-amber-300 text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-0.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>UNPAID • PAYMENT PENDING</span>
                      </Badge>
                    )}

                    {/* FULFILLMENT STATUS */}
                    <Badge
                      variant={
                        order.status === "DELIVERED"
                          ? "default"
                          : order.status === "CONFIRMED"
                          ? "campus"
                          : order.status === "PENDING"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <span className="text-neutral-400 text-[11px]">
                    Placed on {formatDate(order.createdAt)}
                  </span>
                </div>

                {/* Unpaid / Paid Info Advisory Banner */}
                {paid ? (
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 text-emerald-900 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-emerald-950">Payment Verified & Secured</p>
                      <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                        The buyer has deposited the funds into CampusTrade Escrow. Prepare the items and hand them over. Once the buyer enters their 6-digit verification code, the payment will be released directly to your bank account.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-amber-950 flex items-center gap-1.5">
                        <span>Payment Not Made Yet</span>
                        <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.2 rounded-full">
                          Awaiting Buyer Checkout
                        </span>
                      </p>
                      <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                        The buyer submitted this order request without completing payment. <strong>Do not dispatch or hand over products</strong> until payment is confirmed in escrow. You can chat with the buyer to remind them to complete payment on their orders page.
                      </p>
                    </div>
                  </div>
                )}

                {/* Items Ordered List */}
                {order.items && order.items.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-neutral-50/70 border border-neutral-100 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Ordered Items ({order.items.length})
                    </p>
                    <div className="divide-y divide-neutral-200/60">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 overflow-hidden shrink-0">
                              {item.product?.images && item.product.images[0] ? (
                                <img
                                  src={item.product.images[0].url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                                  📦
                                </div>
                              )}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-neutral-900 truncate">
                                {item.product?.title || "Product"}
                              </p>
                              <p className="text-[11px] text-neutral-500">
                                Qty: {item.quantity} &times; {formatNGN(item.price)}
                              </p>
                            </div>
                          </div>
                          <span className="font-extrabold text-neutral-900 shrink-0">
                            {formatNGN(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Details: Buyer, Delivery, and Financial Total */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                  {/* Buyer Details */}
                  <div className="space-y-1 text-neutral-600 bg-neutral-50/40 p-3 rounded-2xl border border-neutral-100">
                    <p className="font-bold text-neutral-900">Buyer Contact:</p>
                    <p className="font-semibold text-neutral-800">{order.buyerName}</p>
                    <p className="flex items-center gap-1.5 text-neutral-500">
                      <Phone className="w-3 h-3 text-neutral-400" /> {order.buyerPhone}
                    </p>
                    <p className="flex items-center gap-1.5 text-neutral-500 truncate">
                      <Mail className="w-3 h-3 text-neutral-400 shrink-0" /> {order.buyerEmail}
                    </p>
                  </div>

                  {/* Delivery Location */}
                  <div className="space-y-1 text-neutral-600 bg-neutral-50/40 p-3 rounded-2xl border border-neutral-100">
                    <p className="font-bold text-neutral-900">Delivery Details:</p>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {order.deliveryMethod}
                    </Badge>
                    <p className="flex items-start gap-1.5 text-neutral-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{order.deliveryAddress}</span>
                    </p>
                  </div>

                  {/* Payment Breakdown & Direct Chat */}
                  <div className="flex flex-col justify-between items-start md:items-end bg-neutral-50/40 p-3 rounded-2xl border border-neutral-100">
                    <div className="text-left md:text-right w-full">
                      <span className="text-[11px] text-neutral-400 block">Total Amount:</span>
                      <span className="text-xl font-black text-neutral-950 block">
                        {formatNGN(order.totalAmount)}
                      </span>
                      <span
                        className={`text-[10px] font-bold block mt-0.5 ${
                          paid ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {paid ? "✓ Payment Confirmed in Escrow" : "⏳ Buyer Payment Pending"}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/messages${order.buyerId ? `?buyer=${order.buyerId}` : ""}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs mt-3 w-full md:w-auto justify-center cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat with Buyer
                    </Link>
                  </div>
                </div>

                {/* Fulfillment Actions */}
                <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <span className="font-medium">Fulfillment status:</span>
                    <span className="font-bold text-neutral-800">{order.status}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status !== "CONFIRMED" && order.status !== "DELIVERED" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "CONFIRMED", paid)}
                        className="px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold transition-colors cursor-pointer"
                      >
                        Confirm Order
                      </button>
                    )}
                    {order.status !== "DELIVERED" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "DELIVERED", paid)}
                        className={`px-3 py-1.5 rounded-xl border font-bold transition-colors cursor-pointer ${
                          paid
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                        }`}
                        title={!paid ? "Warning: Buyer has not paid yet" : undefined}
                      >
                        Mark Delivered {!paid && "⚠️ (Unpaid)"}
                      </button>
                    )}
                    {order.status !== "CANCELLED" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "CANCELLED", paid)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}