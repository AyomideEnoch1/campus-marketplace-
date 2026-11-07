"use client";

import * as React from "react";
import {
  ShoppingBag,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNGN, formatDate } from "@/lib/utils";

interface VendorOrdersClientProps {
  initialOrders: any[];
}

export function VendorOrdersClient({ initialOrders }: VendorOrdersClientProps) {
  const [orders, setOrders] = React.useState(initialOrders);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center rounded-3xl border border-dashed border-neutral-200 bg-white p-8 space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-neutral-800">No Orders Received Yet</h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          When students on campus place orders or submit requests for your products, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-neutral-900 text-sm">
                #{order.orderNumber}
              </span>
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
            <span className="text-neutral-400">{formatDate(order.createdAt)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Buyer Details */}
            <div className="space-y-1 text-neutral-600">
              <p className="font-bold text-neutral-900">Buyer Information:</p>
              <p className="font-medium text-neutral-800">{order.buyerName}</p>
              <p className="flex items-center gap-1 text-neutral-500">
                <Phone className="w-3 h-3" /> {order.buyerPhone}
              </p>
              <p className="flex items-center gap-1 text-neutral-500">
                <Mail className="w-3 h-3" /> {order.buyerEmail}
              </p>
            </div>

            {/* Delivery/Pickup Location */}
            <div className="space-y-1 text-neutral-600">
              <p className="font-bold text-neutral-900">Fulfillment Method:</p>
              <Badge variant="secondary" className="text-[10px]">
                {order.deliveryMethod}
              </Badge>
              <p className="flex items-center gap-1 text-neutral-500 mt-1">
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{order.deliveryAddress}</span>
              </p>
            </div>

            {/* Order Total & Contact */}
            <div className="flex flex-col justify-between items-start md:items-end">
              <div>
                <span className="text-xs text-neutral-400">Total Amount:</span>
                <span className="text-xl font-extrabold text-neutral-900 block">
                  {formatNGN(order.totalAmount)}
                </span>
              </div>

              <a
                href={`https://wa.me/${order.buyerPhone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(
                  order.buyerName
                )},%20I%20am%20following%20up%20on%20your%20order%20#${
                  order.orderNumber
                }%20on%20CampusTrade`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs mt-2"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Contact on WhatsApp
              </a>
            </div>
          </div>

          {/* Status Changer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-neutral-500">Update fulfillment status:</span>
            <div className="flex items-center gap-1.5">
              {order.status !== "CONFIRMED" && (
                <button
                  disabled={updatingId === order.id}
                  onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                  className="px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
                >
                  Mark Confirmed
                </button>
              )}
              {order.status !== "DELIVERED" && (
                <button
                  disabled={updatingId === order.id}
                  onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                  className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
                >
                  Mark Delivered
                </button>
              )}
              {order.status !== "CANCELLED" && (
                <button
                  disabled={updatingId === order.id}
                  onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                  className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
