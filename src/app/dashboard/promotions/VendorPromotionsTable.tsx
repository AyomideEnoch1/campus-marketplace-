"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Timer,
  Clock,
  Sparkles,
  Flame,
  AlertCircle,
  PlusCircle,
  X,
  Trash2,
  ExternalLink,
  Edit,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { formatNGN } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PromoCountdown } from "@/components/marketplace/PromoCountdown";
import { calculatePromoPrice } from "@/lib/promotions-calc";

interface PromotionItem {
  id: string;
  vendorId: string;
  productId: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  promoPrice: number;
  startAt: string;
  endAt: string;
  label: string | null;
  status: "SCHEDULED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  liveStatus: "SCHEDULED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  effectivePromoPrice: number;
  discountPercent: number;
  savingsAmount: number;
  serverNow: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    stock: number;
    status: string;
    images: { url: string }[];
  };
}

interface VendorProductOption {
  id: string;
  title: string;
  price: number;
  stock: number;
  images: { url: string }[];
}

interface VendorPromotionsTableProps {
  initialPromotions: PromotionItem[];
  vendorProducts: VendorProductOption[];
}

function toDateTimeLocalString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatWATDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VendorPromotionsTable({
  initialPromotions,
  vendorProducts,
}: VendorPromotionsTableProps) {
  const router = useRouter();
  const [promotions, setPromotions] = React.useState<PromotionItem[]>(initialPromotions);
  const [activeTab, setActiveTab] = React.useState<"ALL" | "ACTIVE" | "SCHEDULED" | "EXPIRED">("ALL");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Modal State for Quick Creation
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedProductId, setSelectedProductId] = React.useState<string>(vendorProducts[0]?.id || "");
  const [modalDiscountType, setModalDiscountType] = React.useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [modalDiscountValue, setModalDiscountValue] = React.useState<string>("15");
  const [modalStartAt, setModalStartAt] = React.useState<string>(() => toDateTimeLocalString(new Date()));
  const [modalEndAt, setModalEndAt] = React.useState<string>(() => {
    const f = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return toDateTimeLocalString(f);
  });
  const [modalLabel, setModalLabel] = React.useState<string>("");
  const [modalLoading, setModalLoading] = React.useState(false);
  const [modalError, setModalError] = React.useState("");

  const selectedProduct = React.useMemo(() => {
    return vendorProducts.find((p) => p.id === selectedProductId) || vendorProducts[0];
  }, [vendorProducts, selectedProductId]);

  const modalPreview = React.useMemo(() => {
    const basePrice = selectedProduct?.price || 0;
    const discountVal = parseFloat(modalDiscountValue) || 0;
    return calculatePromoPrice(basePrice, modalDiscountType, discountVal);
  }, [selectedProduct, modalDiscountType, modalDiscountValue]);

  // Filtered promotions
  const filteredPromotions = React.useMemo(() => {
    if (activeTab === "ALL") return promotions;
    return promotions.filter((p) => p.liveStatus === activeTab);
  }, [promotions, activeTab]);

  // Statistics
  const activeCount = promotions.filter((p) => p.liveStatus === "ACTIVE").length;
  const scheduledCount = promotions.filter((p) => p.liveStatus === "SCHEDULED").length;
  const expiredCount = promotions.filter((p) => p.liveStatus === "EXPIRED" || p.status === "EXPIRED").length;

  // Actions
  const handleEndEarly = async (promoId: string) => {
    if (!confirm("Are you sure you want to end this promo immediately? Product price will revert to regular price for buyers.")) {
      return;
    }
    setLoadingId(promoId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/vendor/promotions/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end_early" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to end promo");

      setPromotions((prev) =>
        prev.map((p) => (p.id === promoId ? { ...p, status: "EXPIRED", liveStatus: "EXPIRED" } : p))
      );
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to end promo");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (promoId: string) => {
    if (!confirm("Are you sure you want to delete this promotion record?")) {
      return;
    }
    setLoadingId(promoId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/vendor/promotions/${promoId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete promo");

      setPromotions((prev) => prev.filter((p) => p.id !== promoId));
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete promo");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!selectedProductId) {
      setModalError("Please select a product.");
      return;
    }
    const val = parseFloat(modalDiscountValue);
    if (!modalDiscountValue || isNaN(val) || val <= 0) {
      setModalError("Please enter a valid discount value greater than 0.");
      return;
    }
    if (modalPreview.promoPrice <= 0) {
      setModalError("Promo price cannot be ₦0 or negative.");
      return;
    }
    if (selectedProduct && modalPreview.promoPrice >= selectedProduct.price) {
      setModalError("Promo price must be lower than original price.");
      return;
    }
    const startDate = new Date(modalStartAt);
    const endDate = new Date(modalEndAt);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setModalError("Please pick valid dates.");
      return;
    }
    if (endDate <= startDate) {
      setModalError("End date & time must be after start date & time.");
      return;
    }

    setModalLoading(true);
    try {
      const res = await fetch("/api/vendor/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          discountType: modalDiscountType,
          discountValue: val,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          label: modalLabel.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create promo");
      }

      setIsCreateOpen(false);
      setModalLabel("");
      // Refresh list
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setModalError(err.message || "Failed to create promotion");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-neutral-400 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Deals</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-rose-500/20" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Scheduled Promos</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{scheduledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Expired / Past</p>
            <p className="text-2xl font-black text-neutral-700 mt-1">{expiredCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(["ALL", "ACTIVE", "SCHEDULED", "EXPIRED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              {tab === "ALL" ? `All (${promotions.length})` : `${tab} (${promotions.filter((p) => p.liveStatus === tab).length})`}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-md shadow-emerald-600/20"
        >
          <PlusCircle className="w-4 h-4" /> Create Timed Promo
        </Button>
      </div>

      {/* Promotions Table */}
      {filteredPromotions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Timer className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-neutral-900 text-base">No promotions found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Boost your sales on campus by running flash discounts, Black Friday deals, or limited-time promotional pricing.
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="outline"
            className="text-xs font-bold border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            Run Your First Promo
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-neutral-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Deal Pricing</th>
                  <th className="py-3.5 px-4">Timeframe (WAT)</th>
                  <th className="py-3.5 px-4">Status & Countdown</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredPromotions.map((promo) => {
                  const img = promo.product.images[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80";
                  const isEndingSoon = promo.liveStatus === "ACTIVE";

                  return (
                    <tr key={promo.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Product */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200/80">
                            <Image src={img} alt={promo.product.title} fill className="object-cover" />
                          </div>
                          <div className="min-w-0 max-w-[200px] sm:max-w-[260px]">
                            <Link
                              href={`/product/${promo.product.slug}`}
                              className="font-bold text-neutral-900 hover:text-emerald-700 hover:underline line-clamp-1 block text-xs"
                            >
                              {promo.product.title}
                            </Link>
                            <span className="text-[11px] text-neutral-400">
                              Base: {formatNGN(promo.product.price)} &bull; Stock: {promo.product.stock}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Deal Pricing */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-neutral-950">
                              {formatNGN(promo.effectivePromoPrice)}
                            </span>
                            <Badge className="bg-rose-50 text-rose-700 border border-rose-200 font-black text-[10px] px-1.5 py-0">
                              -{promo.discountPercent}%
                            </Badge>
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            Save {formatNGN(promo.savingsAmount)}
                            {promo.label && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-bold">
                                {promo.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Timeframe */}
                      <td className="py-3 px-4 text-neutral-600">
                        <div className="space-y-0.5 text-[11px]">
                          <div><span className="text-neutral-400">Start:</span> {formatWATDateTime(promo.startAt)}</div>
                          <div><span className="text-neutral-400">End:</span> {formatWATDateTime(promo.endAt)}</div>
                        </div>
                      </td>

                      {/* Status & Live Countdown */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {promo.liveStatus === "ACTIVE" ? (
                            <>
                              <Badge className="bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px]">
                                Active Deal
                              </Badge>
                              <div className="pt-0.5">
                                <PromoCountdown
                                  endAt={promo.endAt}
                                  serverNow={promo.serverNow}
                                  compact
                                  onExpire={() => {
                                    setPromotions((prev) =>
                                      prev.map((p) =>
                                        p.id === promo.id
                                          ? { ...p, liveStatus: "EXPIRED", status: "EXPIRED" }
                                          : p
                                      )
                                    );
                                  }}
                                />
                              </div>
                            </>
                          ) : promo.liveStatus === "SCHEDULED" ? (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                              Scheduled
                            </Badge>
                          ) : (
                            <Badge className="bg-neutral-100 text-neutral-600 border border-neutral-200 font-bold text-[10px]">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {promo.liveStatus === "ACTIVE" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={loadingId === promo.id}
                              onClick={() => handleEndEarly(promo.id)}
                              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 h-8 px-2.5"
                            >
                              End Early
                            </Button>
                          )}

                          <Link href={`/dashboard/products/${promo.product.id}/edit`}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                              title="Edit product & promo"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={loadingId === promo.id}
                            onClick={() => handleDelete(promo.id)}
                            className="h-8 w-8 p-0 text-neutral-400 hover:text-rose-600"
                            title="Delete promo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Create Promotion Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">Schedule a Timed Promo</h3>
                  <p className="text-[11px] text-neutral-500">Pick an item from your catalog to discount</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePromo} className="space-y-4">
              {/* Product Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Select Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-900 focus:outline-none focus:border-emerald-600"
                >
                  {vendorProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} &mdash; ₦{p.price.toLocaleString()} ({p.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Discount Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalDiscountType("PERCENTAGE")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      modalDiscountType === "PERCENTAGE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalDiscountType("FIXED")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      modalDiscountType === "FIXED"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    Fixed Amount (₦)
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  {modalDiscountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Discount Amount (₦) *"}
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  max={modalDiscountType === "PERCENTAGE" ? "99" : selectedProduct?.price ? String(selectedProduct.price - 1) : "99999999"}
                  step="1"
                  placeholder={modalDiscountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 1500"}
                  value={modalDiscountValue}
                  onChange={(e) => setModalDiscountValue(e.target.value)}
                />
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Start Time (WAT) *</label>
                  <Input
                    type="datetime-local"
                    required
                    value={modalStartAt}
                    onChange={(e) => setModalStartAt(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">End Time (WAT) *</label>
                  <Input
                    type="datetime-local"
                    required
                    value={modalEndAt}
                    onChange={(e) => setModalEndAt(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Promo Badge Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Promo Badge Label (Optional)</label>
                <Input
                  maxLength={50}
                  placeholder="e.g. Flash Deal, Black Friday, Campus Rush"
                  value={modalLabel}
                  onChange={(e) => setModalLabel(e.target.value)}
                />
              </div>

              {/* Live Preview Card */}
              {selectedProduct && (
                <div className="p-3.5 rounded-xl bg-neutral-900 text-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Live Promo Preview
                    </span>
                    {modalLabel && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-[9px] font-black uppercase">
                        {modalLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-emerald-400">
                        {formatNGN(modalPreview.promoPrice)}
                      </span>
                      <span className="text-xs text-neutral-400 line-through">
                        {formatNGN(selectedProduct.price)}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-neutral-950 font-black text-xs">
                      -{modalPreview.discountPercent}% OFF
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-800">
                    Shoppers save <strong>{formatNGN(modalPreview.savingsAmount)}</strong>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {modalLoading ? "Scheduling..." : "Confirm & Save Promo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
