"use client";

import { useState } from "react";
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronRight,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

interface OrderItemData {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    title: string;
    images: { url: string }[];
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryAddress: string;
  deliveryMethod: string;
  status: string;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  vendor: {
    storeName: string;
    campus: { name: string };
  };
  items: OrderItemData[];
}

export function AdminOrdersTable({ initialOrders }: { initialOrders: OrderData[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vendor.storeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-950 text-amber-400 border border-amber-800">Pending</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-blue-950 text-blue-400 border border-blue-800">Confirmed</Badge>;
      case "DELIVERED":
        return <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">Delivered</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-950 text-red-400 border border-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by order #, student buyer, or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/60 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4">Vendor & Campus</th>
                <th className="py-3 px-4">Delivery</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No orders matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {o.orderNumber}
                    </td>

                    <td className="py-3 px-4 text-neutral-400">
                      {formatDate(o.createdAt)}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{o.buyerName}</p>
                      <p className="text-[10px] text-neutral-400">{o.buyerPhone}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{o.vendor.storeName}</p>
                      <p className="text-[10px] text-neutral-400">{o.vendor.campus.name}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-neutral-300">
                        {o.deliveryMethod.toLowerCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      {formatPrice(o.totalAmount)}
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(o.status)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Order {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-neutral-400">
                  Placed on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Buyer & Vendor Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <p className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider mb-1">
                  Buyer Details
                </p>
                <p className="font-bold text-white">{selectedOrder.buyerName}</p>
                <p className="text-neutral-400">{selectedOrder.buyerPhone}</p>
                <p className="text-neutral-400 text-[11px] truncate">{selectedOrder.buyerEmail}</p>
                <p className="text-[11px] text-neutral-300 mt-2 font-medium">
                  {selectedOrder.deliveryAddress}
                </p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <p className="font-bold text-neutral-400 uppercase text-[10px] tracking-wider mb-1">
                  Vendor Details
                </p>
                <p className="font-bold text-white">{selectedOrder.vendor.storeName}</p>
                <p className="text-neutral-400">{selectedOrder.vendor.campus.name}</p>
                <p className="text-emerald-400 font-semibold mt-2">
                  Delivery: {selectedOrder.deliveryMethod}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="font-bold text-xs text-neutral-300">Ordered Items</p>
              <div className="divide-y divide-neutral-800 bg-neutral-950 rounded-xl border border-neutral-800 p-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{item.product.title}</p>
                      <p className="text-neutral-400 text-[11px]">
                        Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-bold text-white">
                      {formatPrice(item.quantity * item.unitPrice)}
                    </p>
                  </div>
                ))}
                <div className="pt-3 mt-1 flex justify-between font-extrabold text-sm text-emerald-400">
                  <span>Grand Total</span>
                  <span>{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Status Override */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-400">Update Status:</span>
              <div className="flex gap-1.5">
                {["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      selectedOrder.status === st
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
