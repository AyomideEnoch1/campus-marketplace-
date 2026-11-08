"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  MessageCircle,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Package,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatNGN, formatDate } from "@/lib/utils";
import { ReviewFormModal } from "@/components/marketplace/ReviewFormModal";

interface OrderItemData {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    title: string;
    images?: { url: string }[];
    slug?: string;
  };
  review?: {
    id: string;
    rating: number;
    status: string;
  } | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  deliveryMethod: string;
  deliveryAddress: string;
  notes?: string | null;
  createdAt: string | Date;
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    whatsapp?: string | null;
    campus?: {
      name: string;
      city: string;
    } | null;
  };
  items: OrderItemData[];
}

interface OrdersClientProps {
  initialOrders: OrderData[];
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = React.useState<OrderData[]>(initialOrders);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  // Review modal state
  const [reviewModalData, setReviewModalData] = React.useState<{
    productId: string;
    orderItemId: string;
    productTitle: string;
    productImage?: string;
    sellerStoreName: string;
  } | null>(null);

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (selectedStatus !== "ALL" && order.status !== selectedStatus) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesStore = order.vendor.storeName.toLowerCase().includes(q);
        const matchesProduct = order.items.some((item) =>
          item.product.title.toLowerCase().includes(q)
        );
        return matchesNumber || matchesStore || matchesProduct;
      }

      return true;
    });
  }, [orders, selectedStatus, searchQuery]);

  const handleReviewSuccess = () => {
    if (reviewModalData) {
      // Mark item as reviewed locally
      setOrders((prev) =>
        prev.map((ord) => ({
          ...ord,
          items: ord.items.map((it) => {
            if (it.id === reviewModalData.orderItemId) {
              return {
                ...it,
                review: { id: "new", rating: 5, status: "PUBLISHED" },
              };
            }
            return it;
          }),
        }))
      );
    }
    setReviewModalData(null);
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Vendor
          </Badge>
        );
    }
  };

  const statuses = [
    { label: "All Orders", value: "ALL", count: orders.length },
    {
      label: "Pending",
      value: "PENDING",
      count: orders.filter((o) => o.status === "PENDING").length,
    },
    {
      label: "Confirmed",
      value: "CONFIRMED",
      count: orders.filter((o) => o.status === "CONFIRMED").length,
    },
    {
      label: "Delivered",
      value: "DELIVERED",
      count: orders.filter((o) => o.status === "DELIVERED").length,
    },
    {
      label: "Cancelled",
      value: "CANCELLED",
      count: orders.filter((o) => o.status === "CANCELLED").length,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20 pt-8 sm:pt-12">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                My Orders
              </h1>
              <Badge variant="secondary" className="text-xs font-bold">
                {orders.length}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Track incoming orders, coordinate meetups on WhatsApp, and leave verified reviews.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/shop">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm">
                Explore Marketplace &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(s.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedStatus === s.value
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-100"
                }`}
              >
                {s.label} ({s.count})
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by order #, store, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-white"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                {searchQuery || selectedStatus !== "ALL"
                  ? "No matching orders found"
                  : "You haven't placed any campus orders yet"}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
                {searchQuery || selectedStatus !== "ALL"
                  ? "Try adjusting your search query or switching filters to see orders."
                  : "Explore thousands of products sold by student vendors right on your campus."}
              </p>
            </div>
            <div>
              <Link href="/shop">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">
                  Browse Campus Marketplace
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const whatsappMsg = `Hi ${order.vendor.storeName}, regarding my CampusTrade order #${order.orderNumber} for ${formatNGN(order.totalAmount)}. Let's coordinate pickup/delivery at: ${order.deliveryAddress}.`;
              const whatsappUrl = order.vendor.whatsapp
                ? `https://wa.me/${order.vendor.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMsg)}`
                : null;

              const canReviewOrder =
                order.status === "CONFIRMED" || order.status === "DELIVERED";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden divide-y divide-neutral-100 transition-shadow hover:shadow-md"
                >
                  {/* Order Top Meta */}
                  <div className="p-5 sm:p-6 bg-neutral-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-black text-sm sm:text-base text-neutral-950">
                          #{order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span>
                          Vendor:{" "}
                          <strong className="text-neutral-900">
                            {order.vendor.storeName}
                          </strong>
                          {order.vendor.campus && (
                            <span className="text-neutral-400 ml-1">
                              ({order.vendor.campus.name})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-sm transition-transform active:scale-95"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat Seller
                        </a>
                      )}
                      <Link href={`/order-success/${order.orderNumber}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold rounded-xl gap-1"
                        >
                          Receipt
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Items in this Order */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                      Ordered Items ({order.items.length})
                    </span>

                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const coverImg =
                          item.product.images?.[0]?.url ||
                          "/images/placeholder.png";

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-50/50 border border-neutral-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl bg-neutral-200 overflow-hidden relative shrink-0">
                                <Image
                                  src={coverImg}
                                  alt={item.product.title}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1">
                                  {item.product.title}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Qty: {item.quantity} &times;{" "}
                                  {formatNGN(item.unitPrice)}
                                </p>
                              </div>
                            </div>

                            {/* Price and Review action */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200/40">
                              <span className="font-extrabold text-xs sm:text-sm text-neutral-900">
                                {formatNGN(item.unitPrice * item.quantity)}
                              </span>

                              {item.review ? (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-bold flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  Reviewed ({item.review.rating}&#9733;)
                                </Badge>
                              ) : canReviewOrder ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setReviewModalData({
                                      productId: item.productId,
                                      orderItemId: item.id,
                                      productTitle: item.product.title,
                                      productImage: coverImg,
                                      sellerStoreName: order.vendor.storeName,
                                    })
                                  }
                                  className="text-[11px] font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-xl h-8 gap-1"
                                >
                                  <Star className="w-3 h-3 text-emerald-600" />
                                  Write Review
                                </Button>
                              ) : (
                                <span className="text-[10px] text-neutral-400">
                                  Review available on delivery
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Footer with Fulfillment Details */}
                  <div className="p-4 sm:p-5 bg-neutral-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span>
                        Fulfillment: <strong>{order.deliveryMethod}</strong> &mdash;{" "}
                        <span className="text-neutral-500">{order.deliveryAddress}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="text-neutral-400">Total Paid:</span>
                      <span className="text-base font-black text-emerald-600">
                        {formatNGN(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Safe Meetup Reminder */}
        <div className="rounded-2xl bg-white border border-neutral-200/80 p-5 flex items-start gap-3.5 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-neutral-600">
            <p className="font-bold text-neutral-900">Student Buyer Protection</p>
            <p>
              Coordinate campus pickups at designated university public zones. Once you inspect and receive your item, remember to submit a verified purchase review to help other students on campus.
            </p>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalData && (
        <ReviewFormModal
          isOpen={true}
          productId={reviewModalData.productId}
          orderItemId={reviewModalData.orderItemId}
          productTitle={reviewModalData.productTitle}
          productImage={reviewModalData.productImage}
          sellerStoreName={reviewModalData.sellerStoreName}
          onClose={() => setReviewModalData(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
