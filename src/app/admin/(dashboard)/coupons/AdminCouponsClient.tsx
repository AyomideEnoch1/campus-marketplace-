"use client";

import * as React from "react";
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Package,
  Calendar,
  Layers,
  History,
  Lock,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatNGN } from "@/lib/utils";

interface CouponData {
  id: string;
  code: string;
  type: string;
  maxRedemptions: number;
  activeRedemptions: number;
  remainingSlots: number;
  freePeriodDays: number;
  inactivityDays: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalRedemptions: number;
  auditLogs: Array<{
    id: string;
    action: string;
    oldValue: string | null;
    newValue: string | null;
    metadata: string | null;
    actorName: string;
    actorEmail?: string;
    createdAt: string;
  }>;
}

interface RedemptionData {
  id: string;
  vendorId: string;
  storeName: string;
  vendorSlug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  vendorApprovalStatus: string;
  status: "ACTIVE" | "EXPIRED" | "RELEASED" | "REVOKED";
  redeemedAt: string;
  accessExpiresAt: string;
  releasedAt: string | null;
  releaseReason: string | null;
  daysUntilExpiry: number;
  totalProducts: number;
  publishedProductsCount: number;
  hasPublishedProducts: boolean;
}

export function AdminCouponsClient({
  initialCoupons,
  initialVendorAccessFee = 15000,
  initialVendorAccessDurationDays = 365,
}: {
  initialCoupons: CouponData[];
  initialVendorAccessFee?: number;
  initialVendorAccessDurationDays?: number;
}) {
  const [coupons, setCoupons] = React.useState<CouponData[]>(initialCoupons);
  const [selectedCouponId, setSelectedCouponId] = React.useState<string>(coupons[0]?.id || "");
  const [redemptions, setRedemptions] = React.useState<RedemptionData[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Standard Vendor Access Pricing Modal
  const [vendorAccessFee, setVendorAccessFee] = React.useState<number>(initialVendorAccessFee);
  const [vendorAccessDurationDays, setVendorAccessDurationDays] = React.useState<number>(initialVendorAccessDurationDays);
  const [showPriceModal, setShowPriceModal] = React.useState<boolean>(false);
  const [priceInput, setPriceInput] = React.useState<number>(initialVendorAccessFee);
  const [durationInput, setDurationInput] = React.useState<number>(initialVendorAccessDurationDays);
  const [savingPrice, setSavingPrice] = React.useState<boolean>(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = React.useState<boolean>(false);
  const [createCode, setCreateCode] = React.useState<string>("FOUNDING50");
  const [createCap, setCreateCap] = React.useState<number>(50);
  const [createFreeDays, setCreateFreeDays] = React.useState<number>(180);
  const [createInactivityDays, setCreateInactivityDays] = React.useState<number>(60);
  const [createIsActive, setCreateIsActive] = React.useState<boolean>(true);
  const [createExpiresAt, setCreateExpiresAt] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Edit Modal
  const [showEditModal, setShowEditModal] = React.useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = React.useState<CouponData | null>(null);
  const [editCode, setEditCode] = React.useState<string>("");
  const [editCap, setEditCap] = React.useState<number>(50);
  const [editFreeDays, setEditFreeDays] = React.useState<number>(180);
  const [editInactivityDays, setEditInactivityDays] = React.useState<number>(60);
  const [editIsActive, setEditIsActive] = React.useState<boolean>(true);
  const [editExpiresAt, setEditExpiresAt] = React.useState<string>("");

  // Revoke confirmation modal
  const [revokingRedemption, setRevokingRedemption] = React.useState<RedemptionData | null>(null);

  const selectedCoupon = coupons.find((c) => c.id === selectedCouponId) || coupons[0] || null;

  // Fetch redemptions when selectedCouponId or statusFilter changes
  const fetchRedemptions = React.useCallback(async (couponId: string, filter: string) => {
    if (!couponId) return;
    setLoadingRedemptions(true);
    try {
      const url = `/api/admin/coupons/${couponId}?status=${filter === "ALL" ? "" : filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.redemptions) {
        setRedemptions(data.redemptions);
        if (data.coupon) {
          setCoupons((prev) =>
            prev.map((c) => (c.id === data.coupon.id ? { ...c, ...data.coupon } : c))
          );
        }
      }
    } catch (err) {
      console.error("Failed to load redemptions:", err);
    } finally {
      setLoadingRedemptions(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedCouponId) {
      fetchRedemptions(selectedCouponId, statusFilter);
    }
  }, [selectedCouponId, statusFilter, fetchRedemptions]);

  // Handle Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        code: createCode,
        maxRedemptions: Number(createCap),
        freePeriodDays: Number(createFreeDays),
        inactivityDays: Number(createInactivityDays),
        isActive: createIsActive,
      };
      if (createExpiresAt) {
        payload.expiresAt = new Date(createExpiresAt).toISOString();
      }

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create coupon");
      }

      toast.success(data.message || "Coupon created successfully!");
      setCoupons((prev) => [data.coupon, ...prev]);
      setSelectedCouponId(data.coupon.id);
      setShowCreateModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (coupon: CouponData) => {
    setEditingCoupon(coupon);
    setEditCode(coupon.code);
    setEditCap(coupon.maxRedemptions);
    setEditFreeDays(coupon.freePeriodDays);
    setEditInactivityDays(coupon.inactivityDays);
    setEditIsActive(coupon.isActive);
    setEditExpiresAt(
      coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : ""
    );
    setShowEditModal(true);
  };

  // Handle Edit Coupon
  const handleEditCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        code: editCode,
        maxRedemptions: Number(editCap),
        freePeriodDays: Number(editFreeDays),
        inactivityDays: Number(editInactivityDays),
        isActive: editIsActive,
        expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
      };

      const res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update coupon");
      }

      toast.success("Coupon updated successfully!");
      setCoupons((prev) =>
        prev.map((c) => (c.id === data.coupon.id ? { ...c, ...data.coupon } : c))
      );
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Revoke Vendor Access
  const handleRevokeVendor = async (redemptionId: string) => {
    if (!selectedCoupon) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/coupons/${selectedCoupon.id}/redemptions/${redemptionId}/revoke`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke access");
      }

      toast.success(data.message || "Vendor access revoked and slot released.");
      setRevokingRedemption(null);
      fetchRedemptions(selectedCoupon.id, statusFilter);
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke vendor access");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Standard Vendor Access Fee
  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (priceInput < 0) {
      toast.error("Access fee cannot be negative.");
      return;
    }
    setSavingPrice(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_access_fee: String(priceInput),
          vendor_access_duration_days: String(durationInput || 365),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update price settings");
      }
      setVendorAccessFee(priceInput);
      setVendorAccessDurationDays(durationInput);
      setShowPriceModal(false);
      toast.success(`Standard vendor access fee updated to ${formatNGN(priceInput)}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save vendor access fee");
    } finally {
      setSavingPrice(false);
    }
  };

  // Filtered redemptions by search query
  const filteredRedemptions = React.useMemo(() => {
    if (!searchQuery.trim()) return redemptions;
    const q = searchQuery.toLowerCase().trim();
    return redemptions.filter(
      (r) =>
        r.storeName?.toLowerCase().includes(q) ||
        r.ownerName?.toLowerCase().includes(q) ||
        r.ownerEmail?.toLowerCase().includes(q)
    );
  }, [redemptions, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Founding Vendor Coupons & Access
            </h1>
            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
              SUPER ADMIN ONLY
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Configure founding vendor coupon caps, 0% commission free periods, inactivity windows, and redemptions audit log.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            onClick={() => {
              setPriceInput(vendorAccessFee);
              setDurationInput(vendorAccessDurationDays);
              setShowPriceModal(true);
            }}
            variant="outline"
            className="border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs rounded-xl shadow-xs gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Storefront Fee: {formatNGN(vendorAccessFee)}</span>
          </Button>

          <Button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </Button>
        </div>
      </div>

      {/* Coupon Selection & Cap Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          const isSelected = coupon.id === selectedCouponId;
          const usagePercent = Math.min(
            100,
            Math.round((coupon.activeRedemptions / coupon.maxRedemptions) * 100)
          );

          return (
            <div
              key={coupon.id}
              onClick={() => setSelectedCouponId(coupon.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? "bg-neutral-900 border-emerald-500 shadow-lg shadow-emerald-950/40"
                  : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <span className="font-mono font-black text-base text-white">
                      {coupon.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        coupon.isActive
                          ? "border-emerald-600 text-emerald-400 bg-emerald-950/30"
                          : "border-neutral-700 text-neutral-400"
                      }`}
                    >
                      {coupon.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(coupon);
                      }}
                      className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                      title="Edit coupon settings"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Usage Numbers */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Cap Usage:</span>
                    <span className="font-bold text-white">
                      <strong className="text-emerald-400">{coupon.activeRedemptions}</strong> / {coupon.maxRedemptions} active
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usagePercent >= 90
                          ? "bg-rose-500"
                          : usagePercent >= 70
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                    <span>{coupon.remainingSlots} slots remaining</span>
                    <span>{usagePercent}% claimed</span>
                  </div>
                </div>
              </div>

              {/* Sub-parameters */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
                <div>
                  <span className="text-neutral-400">Free Period: </span>
                  <strong className="text-neutral-200">{coupon.freePeriodDays} days</strong>
                </div>
                <div>
                  <span className="text-neutral-400">Inactivity: </span>
                  <strong className="text-neutral-200">{coupon.inactivityDays} days</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Coupon Detail & Redemptions Section */}
      {selectedCoupon && (
        <div className="space-y-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">
                  Redemptions &amp; Active Vendors ({selectedCoupon.code})
                </h2>
                <Badge className="bg-neutral-800 text-neutral-300 text-xs">
                  {selectedCoupon.activeRedemptions} / {selectedCoupon.maxRedemptions} Active Slots
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Vendors currently selling with 0% commission and full dashboard entitlements.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search store / vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-xs h-9 pl-8 w-44 sm:w-56 rounded-xl"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-xl h-9 px-3 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active ({selectedCoupon.activeRedemptions})</option>
                <option value="EXPIRED">Expired</option>
                <option value="RELEASED">Released</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </div>

          {/* Redemptions Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-800/60 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Vendor / Store</th>
                  <th className="py-3 px-4">Approval</th>
                  <th className="py-3 px-4">Coupon Status</th>
                  <th className="py-3 px-4">Redeemed Date</th>
                  <th className="py-3 px-4">Access Expiry</th>
                  <th className="py-3 px-4 text-center">Products Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                {loadingRedemptions ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      Loading vendor redemptions...
                    </td>
                  </tr>
                ) : filteredRedemptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      No redemptions found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredRedemptions.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <strong className="text-white font-bold">{r.storeName}</strong>
                          <div className="text-[11px] text-neutral-400">{r.ownerName} &bull; {r.ownerEmail}</div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            r.vendorApprovalStatus === "APPROVED"
                              ? "border-emerald-700 text-emerald-400 bg-emerald-950/30"
                              : r.vendorApprovalStatus === "REJECTED"
                              ? "border-rose-700 text-rose-400 bg-rose-950/30"
                              : "border-amber-700 text-amber-400 bg-amber-950/30"
                          }`}
                        >
                          {r.vendorApprovalStatus}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] ${
                            r.status === "ACTIVE"
                              ? "bg-emerald-600 text-white"
                              : r.status === "EXPIRED"
                              ? "bg-neutral-700 text-neutral-300"
                              : r.status === "RELEASED"
                              ? "bg-amber-600 text-white"
                              : "bg-rose-700 text-white"
                          }`}
                        >
                          {r.status}
                        </Badge>
                        {r.releaseReason && (
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Reason: {r.releaseReason.toLowerCase()}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-neutral-300">
                        {new Date(r.redeemedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <span>{new Date(r.accessExpiresAt).toLocaleDateString()}</span>
                          {r.status === "ACTIVE" && (
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              {r.daysUntilExpiry} days left
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {r.hasPublishedProducts ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Yes ({r.publishedProductsCount})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-neutral-400 text-xs">
                            <XCircle className="w-3.5 h-3.5" />
                            No products
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {r.status === "ACTIVE" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRevokingRedemption(r)}
                            className="text-[11px] h-7 px-2.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-rose-300"
                          >
                            Revoke
                          </Button>
                        ) : (
                          <span className="text-[11px] text-neutral-400">Slot Freed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Audit Log Accordion / Section */}
          <div className="mt-8 pt-6 border-t border-neutral-800 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Coupon Audit Log</h3>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 rounded-2xl bg-neutral-950/70 p-3 border border-neutral-800 text-xs">
              {selectedCoupon.auditLogs?.length === 0 ? (
                <p className="text-neutral-400 text-center py-4">No audit events recorded yet.</p>
              ) : (
                selectedCoupon.auditLogs?.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-neutral-800 text-neutral-300 text-[10px]">
                          {log.action}
                        </Badge>
                        <span className="font-semibold text-neutral-200">
                          {log.actorName} ({log.actorEmail})
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        {log.oldValue && <span>Previous: {log.oldValue} &rarr; </span>}
                        <span>Updated: {log.newValue}</span>
                        {log.metadata && <span className="block text-neutral-400">{log.metadata}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div>
              <h3 className="text-lg font-black text-white">Create Founding Coupon</h3>
              <p className="text-xs text-neutral-400">Configure parameters for free vendor access.</p>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-300">Coupon Code *</label>
                <Input
                  required
                  placeholder="e.g. FOUNDING50"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  className="bg-neutral-800 border-neutral-700 text-xs font-mono font-bold mt-1 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300">Cap (Max Slots) *</label>
                  <Input
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={createCap}
                    onChange={(e) => setCreateCap(parseInt(e.target.value, 10) || 1)}
                    className="bg-neutral-800 border-neutral-700 text-xs mt-1"
                  />
                  <span className="text-[10px] text-neutral-400">Default: 50 slots</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300">Free Period (Days) *</label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={createFreeDays}
                    onChange={(e) => setCreateFreeDays(parseInt(e.target.value, 10) || 1)}
                    className="bg-neutral-800 border-neutral-700 text-xs mt-1"
                  />
                  <span className="text-[10px] text-neutral-400">Default: 180 days</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300">Inactivity Window *</label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={createInactivityDays}
                    onChange={(e) => setCreateInactivityDays(parseInt(e.target.value, 10) || 1)}
                    className="bg-neutral-800 border-neutral-700 text-xs mt-1"
                  />
                  <span className="text-[10px] text-neutral-400">Release if 0 products in X days</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300">Stop New Claims</label>
                  <Input
                    type="datetime-local"
                    value={createExpiresAt}
                    onChange={(e) => setCreateExpiresAt(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-xs mt-1"
                  />
                  <span className="text-[10px] text-neutral-400">Optional deadline</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createIsActive"
                  checked={createIsActive}
                  onChange={(e) => setCreateIsActive(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="createIsActive" className="text-xs text-neutral-200 font-semibold cursor-pointer">
                  Coupon is active immediately for redemptions
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-neutral-700 text-neutral-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {isSubmitting ? "Creating..." : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div>
              <h3 className="text-lg font-black text-white">Edit Coupon ({editingCoupon.code})</h3>
              <p className="text-xs text-neutral-400">
                Active redemptions: {editingCoupon.activeRedemptions}. Lowering cap below {editingCoupon.activeRedemptions} will be rejected.
              </p>
            </div>

            <form onSubmit={handleEditCoupon} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-300">Coupon Code</label>
                <Input
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  className="bg-neutral-800 border-neutral-700 text-xs font-mono font-bold mt-1 uppercase"
                />
                <span className="text-[10px] text-neutral-400">
                  Changing code blocks NEW redemptions of old code; active vendors keep access.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300">Cap (Max Slots)</label>
                  <Input
                    type="number"
                    min={editingCoupon.activeRedemptions}
                    max={10000}
                    required
                    value={editCap}
                    onChange={(e) => setEditCap(parseInt(e.target.value, 10) || 1)}
                    className="bg-neutral-800 border-neutral-700 text-xs mt-1"
                  />
                  <span className="text-[10px] text-neutral-400">Min: {editingCoupon.activeRedemptions} (active count)</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300">Free Period (Days)</label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={editFreeDays}
                    onChange={(e) => setEditFreeDays(parseInt(e.target.value, 10) || 1)}
                    className="bg-neutral-800 border-neutral-700 text-xs mt-1"
                  />
                  <span className="text-[10px] text-neutral-400">Future claims only</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300">Inactivity Window</label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={editInactivityDays}
                    onChange={(e) => setEditInactivityDays(parseInt(e.target.value, 10) || 1)}
                    className="bg-neutral-800 border-neutral-700 text-xs mt-1"
                  />
                  <span className="text-[10px] text-neutral-400">Future claims only</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300">Stop New Claims</label>
                  <Input
                    type="datetime-local"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="editIsActive" className="text-xs text-neutral-200 font-semibold cursor-pointer">
                  Coupon active (uncheck to deactivate new redemptions)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="border-neutral-700 text-neutral-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVOKE CONFIRMATION MODAL */}
      {revokingRedemption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Revoke Vendor Access?
                </h3>
                <p className="text-xs text-neutral-400">
                  {revokingRedemption.storeName} ({revokingRedemption.ownerName})
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              This will immediately revoke this vendor&apos;s coupon access, reopen their slot in the founding cap, and hide their published listings from the campus shop. The vendor will need to pay to reactivate their store.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRevokingRedemption(null)}
                className="border-neutral-700 text-neutral-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRevokeVendor(revokingRedemption.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {isSubmitting ? "Revoking..." : "Confirm Revocation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD VENDOR ACCESS PRICING MODAL */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Vendor Storefront Pricing
                </h3>
                <p className="text-xs text-neutral-400">
                  Update standard subscription fee & duration
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              This price is displayed on the vendor activation page (<code>/dashboard/activate</code>) for vendors who do not have a free Founding Coupon.
            </p>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Access Fee in Naira (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">₦</span>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={priceInput}
                    onChange={(e) => setPriceInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="bg-neutral-800 border-neutral-700 pl-8 text-xs font-mono font-bold text-white"
                  />
                </div>
                <p className="text-[10px] text-emerald-400 mt-1">
                  Preview: {formatNGN(priceInput)}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Validity Duration (Days)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="1825"
                  required
                  value={durationInput}
                  onChange={(e) => setDurationInput(Math.max(1, parseInt(e.target.value, 10) || 365))}
                  className="bg-neutral-800 border-neutral-700 text-xs font-mono text-white"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Default is 365 days (1 year access).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPriceModal(false)}
                  className="border-neutral-700 text-neutral-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingPrice}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {savingPrice ? "Updating..." : "Save Pricing"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
