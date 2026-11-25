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
  Key,
  Lock,
  AlertCircle,
  RefreshCw,
  Zap,
  GraduationCap,
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
  buyerCampus?: string | null;
  deliveryAddress: string;
  deliveryMethod: string;
  status: "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  subtotal?: number | null;
  seller_amount?: number | null;
  commission?: number | null;
  paid_at?: string | Date | null;
  delivered_at?: string | Date | null;
  dispute_deadline?: string | Date | null;
  escrow_status: string;
  escrow_mode: string;
  createdAt: string | Date;
  items?: OrderItem[];
  deliveryCode?: {
    attempts: number;
    locked: boolean;
  } | null;
}

interface VendorOrdersClientProps {
  initialOrders: OrderRecord[];
}

export function VendorOrdersClient({ initialOrders }: VendorOrdersClientProps) {
  const [orders, setOrders] = React.useState<OrderRecord[]>(initialOrders);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [filterTab, setFilterTab] = React.useState<"PAID" | "ALL" | "UNPAID" | "DELIVERED">("PAID");
  const [searchQuery, setSearchQuery] = React.useState("");

  // 6-digit Handover Code Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = React.useState(false);
  const [verifyingOrder, setVerifyingOrder] = React.useState<OrderRecord | null>(null);
  const [codeDigits, setCodeDigits] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = React.useState<number | null>(null);
  const [isLocked, setIsLocked] = React.useState(false);
  const [verifySuccess, setVerifySuccess] = React.useState(false);

  const openVerifyModal = (order: OrderRecord) => {
    setVerifyingOrder(order);
    setCodeDigits("");
    setVerifyError(null);
    setAttemptsRemaining(null);
    setIsLocked(Boolean(order.deliveryCode?.locked));
    setVerifySuccess(false);
    setVerifyModalOpen(true);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingOrder || codeDigits.length !== 6) return;

    setVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch("/api/escrow/verify-delivery-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: verifyingOrder.id,
          deliveryCode: codeDigits.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.isLocked) {
          setIsLocked(true);
        }
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        throw new Error(data.error || "Incorrect delivery verification code.");
      }

      // Verification Success!
      setVerifySuccess(true);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === verifyingOrder.id
            ? {
                ...o,
                status: "DELIVERED",
                escrow_status: "delivered",
                delivered_at: data.delivered_at || new Date().toISOString(),
                dispute_deadline: data.dispute_deadline,
                deliveryCode: {
                  attempts: (o.deliveryCode?.attempts || 0) + 1,
                  locked: false,
                },
              }
            : o
        )
      );

      setTimeout(() => {
        setVerifyModalOpen(false);
        setVerifySuccess(false);
      }, 1800);
    } catch (err: any) {
      setVerifyError(err.message || "Failed to verify handover code.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, isPaid: boolean) => {
    if (newStatus === "DELIVERED" && !isPaid) {
      const confirmDeliverUnpaid = window.confirm(
        "⚠️ PAYMENT NOTICE:\n\nThis order is marked as UNPAID. The buyer has NOT completed payment yet.\n\nAre you sure you want to mark it as Delivered before payment is verified?"
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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order status");
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to dismiss this unpaid order?")) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      alert(err.message || "Failed to remove order");
    } finally {
      setUpdatingId(null);
    }
  };

  const isOrderPaid = (order: OrderRecord) => {
    return (
      Boolean(order.paid_at) ||
      ["paid_held", "confirmed", "delivered", "disputed", "payout_pending", "released"].includes(
        order.escrow_status
      )
    );
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
            Paid Orders ({paidCount})
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
            const isEscrow = order.escrow_mode === "escrow";
            const isReleased = order.escrow_status === "released";
            const isDisputed = order.escrow_status === "disputed";
            const isHandoverDelivered = order.status === "DELIVERED";
            const codeLocked = Boolean(order.deliveryCode?.locked);

            const displaySubtotal = order.subtotal || order.totalAmount;
            const displayCommission = order.commission || Math.round(displaySubtotal * 0.05);
            const displaySellerNet = order.seller_amount || (displaySubtotal - displayCommission);

            return (
              <div
                key={order.id}
                className={`p-5 rounded-3xl bg-white border transition-all space-y-4 ${
                  paid
                    ? "border-emerald-200/90 shadow-sm shadow-emerald-500/5"
                    : "border-amber-200/90 shadow-sm shadow-amber-500/5 bg-gradient-to-b from-amber-50/20 to-white"
                }`}
              >
                {/* Header: Order ID, Date, Payment Status & Mode Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-neutral-100 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-neutral-900 text-sm">
                      #{order.orderNumber}
                    </span>

                    {/* Escrow vs Direct Badge */}
                    {isEscrow ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {isReleased
                            ? "PAID • FUNDS RELEASED"
                            : isDisputed
                            ? "PAID • DISPUTED (FROZEN)"
                            : paid
                            ? "PAID • HELD IN ESCROW"
                            : "UNPAID • ESCROW ORDER"}
                        </span>
                      </Badge>
                    ) : (
                      <Badge className="bg-neutral-100 text-neutral-800 border border-neutral-300 text-[11px] font-bold flex items-center gap-1 px-2 py-0.5">
                        <Zap className="w-3 h-3 text-neutral-600" />
                        <span>{paid ? "PAID • DIRECT SETTLEMENT" : "UNPAID • DIRECT"}</span>
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

                {/* Status-Specific Advisory Banners */}
                {isDisputed ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-amber-950 flex items-center gap-2">
                        <span>Escrow Dispute Active — Payout Frozen</span>
                        <Badge className="bg-amber-200 text-amber-900 text-[10px] font-bold">
                          Under Review
                        </Badge>
                      </p>
                      <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                        The buyer opened a dispute during the 48-hour inspection period. Automatic escrow release is strictly frozen. A platform mediator is reviewing the order details.
                      </p>
                    </div>
                  </div>
                ) : isReleased ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-emerald-950">Payout Released to Your Account</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                        Funds ({formatNGN(displaySellerNet)}) have been released from platform escrow and processed to your registered payout account.
                      </p>
                    </div>
                  </div>
                ) : isHandoverDelivered && isEscrow ? (
                  <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-blue-950 flex items-center gap-1.5">
                        <span>Handover Verified • 48-Hour Inspection Window Active</span>
                        <span className="text-[10px] font-semibold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full">
                          Inspection Running
                        </span>
                      </p>
                      <p className="text-[11px] text-blue-900/90 mt-0.5 leading-relaxed">
                        The buyer provided the 6-digit delivery code. Funds are held during the mandatory 48-hour buyer inspection window. If no dispute is filed, your payout will release automatically.
                      </p>
                    </div>
                  </div>
                ) : paid && isEscrow ? (
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 text-emerald-900 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-emerald-950">Payment Secured in Escrow</p>
                      <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                        The buyer has deposited the funds. Meet the buyer at the campus meetup point. <strong>Request their 6-digit handover code</strong> in person after they inspect the items, then click "Verify Handover Code" below.
                      </p>
                    </div>
                  </div>
                ) : !paid ? (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-amber-950 flex items-center gap-1.5">
                        <span>Payment Not Completed Yet</span>
                        <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-900 px-2 py-0.2 rounded-full">
                          Pending Buyer Checkout
                        </span>
                      </p>
                      <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                        The buyer initiated this order request without completing payment. <strong>Do not dispatch or hand over products</strong> until payment is confirmed.
                      </p>
                    </div>
                  </div>
                ) : null}

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
                    {order.buyerCampus && (
                      <p className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{order.buyerCampus}</span>
                      </p>
                    )}
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

                  {/* Financial Breakdown & Net Seller Proceeds */}
                  <div className="flex flex-col justify-between items-start md:items-end bg-neutral-50/40 p-3 rounded-2xl border border-neutral-100">
                    <div className="text-left md:text-right w-full space-y-0.5">
                      <span className="text-[11px] text-neutral-400 block">Buyer Total: {formatNGN(order.totalAmount)}</span>
                      <div className="text-[10px] text-neutral-500 flex justify-between md:justify-end gap-2">
                        <span>Platform Fee (5%):</span>
                        <span className="font-semibold text-neutral-700">-{formatNGN(displayCommission)}</span>
                      </div>
                      <div className="pt-1 border-t border-neutral-200/60">
                        <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider">
                          Your Net Payout:
                        </span>
                        <span className="text-xl font-black text-emerald-700 block">
                          {formatNGN(displaySellerNet)}
                        </span>
                      </div>
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

                    {/* ESCROW WORKFLOW: 6-Digit Handover Verification */}
                    {isEscrow ? (
                      order.status !== "DELIVERED" ? (
                        paid ? (
                          codeLocked ? (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              Verification Locked (5 Failed Attempts)
                            </Badge>
                          ) : (
                            <button
                              onClick={() => openVerifyModal(order)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Verify Handover Code</span>
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                            Awaiting Buyer Payment
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Handover Verified
                        </span>
                      )
                    ) : (
                      /* DIRECT ORDER WORKFLOW: Standard fulfillment */
                      order.status !== "DELIVERED" && (
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
                      )
                    )}

                    {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "CANCELLED", paid)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}

                    {!paid && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleDeleteOrder(order.id)}
                        className="px-3 py-1.5 rounded-xl border border-neutral-300 text-neutral-600 hover:bg-neutral-100 font-bold transition-colors cursor-pointer text-xs"
                      >
                        Dismiss Unpaid Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6-Digit Handover Code Verification Modal */}
      {verifyModalOpen && verifyingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-950">
                    Verify Handover Code
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Order #{verifyingOrder.orderNumber} &bull; {verifyingOrder.buyerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {verifySuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-extrabold text-neutral-950">
                  Handover Verified Successfully!
                </h4>
                <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                  The order is now marked as delivered and the 48-hour buyer inspection window has begun.
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Ask the buyer for their private <strong>6-digit delivery code</strong> in person after they have physically inspected their items at your meetup location.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-800 block text-center">
                    Enter 6-Digit Buyer Code
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    disabled={isLocked || verifying}
                    placeholder="••••••"
                    value={codeDigits}
                    onChange={(e) => setCodeDigits(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-14 text-center font-mono text-2xl tracking-[0.5em] font-black rounded-2xl border-2 border-neutral-300 focus:border-emerald-600 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>

                {verifyError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">{verifyError}</p>
                      {attemptsRemaining !== null && !isLocked && (
                        <p className="text-[11px] text-rose-700 font-semibold">
                          Warning: {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} remaining before lockout.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {isLocked && (
                  <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-black text-rose-950">Verification Permanently Locked</p>
                      <p className="text-[11px] text-rose-900 leading-relaxed">
                        5 incorrect attempts were made for this order. For fraud prevention, handover verification is locked. Please contact platform support or mediation.
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-neutral-100/70 text-[11px] text-neutral-500 space-y-1">
                  <p className="font-semibold text-neutral-700">🔒 Security Notice:</p>
                  <p>Verification locks permanently after 5 incorrect attempts. Do not guess codes.</p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <Button
                    type="submit"
                    disabled={codeDigits.length !== 6 || verifying || isLocked}
                    className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Verifying Code...
                      </>
                    ) : (
                      "Verify & Confirm Handover"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVerifyModalOpen(false)}
                    className="h-11 rounded-2xl border-neutral-300 text-neutral-700 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
