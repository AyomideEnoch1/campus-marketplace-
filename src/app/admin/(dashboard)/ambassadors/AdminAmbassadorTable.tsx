"use client";

import * as React from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Wallet,
  Users,
  Store,
  ArrowUpRight,
  Sparkles,
  Building,
  CreditCard,
  Send,
  ExternalLink,
  Coins,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Lock,
  Unlock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Megaphone,
  Pencil,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { AmbassadorBannerConfig } from "@/lib/referral";

interface AmbassadorItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  referralCode: string;
  status: string;
  campusName: string;
  campusId: string;
  totalClicks: number;
  totalReferrals: number;
  vendorCount: number;
  qualifiedVendors: number;
  buyerCount: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalEarnings: number;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankVerified?: boolean;
  createdAt: string;
}

interface CampusItem {
  id: string;
  name: string;
}

export interface ReferralRewardRates {
  vendorBonus: number;
  buyerBonus: number;
  qualifiedVendorBonus: number;
}

export function AdminAmbassadorTable({
  initialAmbassadors,
  campuses,
  initialRewardConfig,
  initialPayoutRequestsLocked,
  initialBannerConfig,
  currentAdminRole,
}: {
  initialAmbassadors: AmbassadorItem[];
  campuses: CampusItem[];
  initialRewardConfig?: ReferralRewardRates;
  initialPayoutRequestsLocked?: boolean;
  initialBannerConfig?: AmbassadorBannerConfig;
  currentAdminRole?: string;
}) {
  const [ambassadors, setAmbassadors] = React.useState<AmbassadorItem[]>(initialAmbassadors);
  const [search, setSearch] = React.useState("");
  const [selectedCampus, setSelectedCampus] = React.useState("ALL");
  const [payingAmbassador, setPayingAmbassador] = React.useState<AmbassadorItem | null>(null);
  const [payoutAmount, setPayoutAmount] = React.useState<number>(0);
  const [payoutNotes, setPayoutNotes] = React.useState("");
  const [processingPayout, setProcessingPayout] = React.useState(false);
  const [payoutRequestsLocked, setPayoutRequestsLocked] = React.useState<boolean>(
    Boolean(initialPayoutRequestsLocked)
  );
  const [togglingLock, setTogglingLock] = React.useState(false);
  const isSuperAdmin = currentAdminRole === "SUPERADMIN";

  // Ambassador Hub Announcement Banner State (Superadmin Managed)
  const [bannerConfig, setBannerConfig] = React.useState<AmbassadorBannerConfig>(
    initialBannerConfig || {
      enabled: false,
      message: "",
      title: "",
      type: "info",
    }
  );
  const [bannerEnabled, setBannerEnabled] = React.useState<boolean>(
    Boolean(initialBannerConfig?.enabled)
  );
  const [bannerTitle, setBannerTitle] = React.useState<string>(
    initialBannerConfig?.title || ""
  );
  const [bannerMessage, setBannerMessage] = React.useState<string>(
    initialBannerConfig?.message || ""
  );
  const [bannerType, setBannerType] = React.useState<"info" | "warning" | "success" | "announcement">(
    initialBannerConfig?.type || "info"
  );
  const [isEditingBanner, setIsEditingBanner] = React.useState(false);
  const [savingBanner, setSavingBanner] = React.useState(false);

  async function handleSaveBanner(e?: React.FormEvent, customEnabled?: boolean) {
    if (e) e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Forbidden: Only Super Administrators can update the ambassador banner.");
      return;
    }

    const targetEnabled = customEnabled !== undefined ? customEnabled : bannerEnabled;

    if (targetEnabled && !bannerMessage.trim()) {
      toast.error("Please enter a message before activating the announcement banner.");
      return;
    }

    try {
      setSavingBanner(true);
      const res = await fetch("/api/admin/ambassadors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner: {
            enabled: targetEnabled,
            title: bannerTitle.trim(),
            message: bannerMessage.trim(),
            type: bannerType,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update banner");

      setBannerConfig(data.bannerConfig);
      setBannerEnabled(data.bannerConfig.enabled);
      setBannerTitle(data.bannerConfig.title || "");
      setBannerMessage(data.bannerConfig.message || "");
      setBannerType(data.bannerConfig.type || "info");
      toast.success(data.message || "Announcement banner updated successfully");
      setIsEditingBanner(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update announcement banner");
    } finally {
      setSavingBanner(false);
    }
  }

  async function handleToggleBannerActive() {
    if (!isSuperAdmin) {
      toast.error("Forbidden: Only Super Administrators can update the ambassador banner.");
      return;
    }
    const nextState = !bannerEnabled;
    if (nextState && !bannerMessage.trim()) {
      toast.error("Please write a message into the banner before activating it.");
      setIsEditingBanner(true);
      return;
    }
    await handleSaveBanner(undefined, nextState);
  }

  async function handleTogglePayoutLock() {
    if (!isSuperAdmin) {
      toast.error("Forbidden: Only Super Administrators can lock or unlock earning requests.");
      return;
    }

    const nextState = !payoutRequestsLocked;
    const confirmPrompt = nextState
      ? "Are you sure you want to LOCK ambassador earning requests?\n\nAmbassadors will NOT be able to submit payout requests from their dashboard while this is locked."
      : "Are you sure you want to UNLOCK ambassador earning requests?\n\nAmbassadors with verified Nigerian bank accounts will be able to request their pending referral earnings.";

    if (!window.confirm(confirmPrompt)) return;

    try {
      setTogglingLock(true);
      const res = await fetch("/api/admin/ambassadors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutRequestsLocked: nextState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update lock status");

      setPayoutRequestsLocked(Boolean(data.payoutRequestsLocked));
      toast.success(
        nextState
          ? "Ambassador earning request button has been LOCKED."
          : "Ambassador earning request button has been UNLOCKED."
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update payout request lock");
    } finally {
      setTogglingLock(false);
    }
  }

  // Referral Reward Rates State
  const [rewardRates, setRewardRates] = React.useState<ReferralRewardRates>(
    initialRewardConfig || {
      vendorBonus: 500,
      buyerBonus: 100,
      qualifiedVendorBonus: 1000,
    }
  );
  const [vendorBonusInput, setVendorBonusInput] = React.useState(
    (initialRewardConfig?.vendorBonus ?? 500).toString()
  );
  const [buyerBonusInput, setBuyerBonusInput] = React.useState(
    (initialRewardConfig?.buyerBonus ?? 100).toString()
  );
  const [qualifiedVendorBonusInput, setQualifiedVendorBonusInput] = React.useState(
    (initialRewardConfig?.qualifiedVendorBonus ?? 1000).toString()
  );
  const [savingRates, setSavingRates] = React.useState(false);
  const [isEditingRates, setIsEditingRates] = React.useState(false);

  async function handleSaveRates(e: React.FormEvent) {
    e.preventDefault();
    const vBonus = parseFloat(vendorBonusInput);
    const bBonus = parseFloat(buyerBonusInput);
    const qBonus = parseFloat(qualifiedVendorBonusInput);

    if (isNaN(vBonus) || vBonus < 0) {
      toast.error("Please enter a valid vendor bounty (₦)");
      return;
    }
    if (isNaN(bBonus) || bBonus < 0) {
      toast.error("Please enter a valid shopper bounty (₦)");
      return;
    }
    if (isNaN(qBonus) || qBonus < 0) {
      toast.error("Please enter a valid qualified vendor bonus (₦)");
      return;
    }

    try {
      setSavingRates(true);
      const res = await fetch("/api/admin/ambassadors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorBonus: vBonus,
          buyerBonus: bBonus,
          qualifiedVendorBonus: qBonus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update reward rates");

      toast.success("Referral bounty rates updated! Reflected on ambassador dashboards.");
      if (data.rewardConfig) {
        setRewardRates(data.rewardConfig);
        setVendorBonusInput(data.rewardConfig.vendorBonus.toString());
        setBuyerBonusInput(data.rewardConfig.buyerBonus.toString());
        setQualifiedVendorBonusInput(data.rewardConfig.qualifiedVendorBonus.toString());
      }
      setIsEditingRates(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update rates");
    } finally {
      setSavingRates(false);
    }
  }

  function handleResetRates() {
    setVendorBonusInput("500");
    setBuyerBonusInput("100");
    setQualifiedVendorBonusInput("1000");
  }

  // Compute totals
  const totalPendingPayouts = ambassadors.reduce((sum, a) => sum + a.pendingEarnings, 0);
  const totalPaidOut = ambassadors.reduce((sum, a) => sum + a.paidEarnings, 0);
  const totalRecruitedVendors = ambassadors.reduce((sum, a) => sum + a.vendorCount, 0);
  const totalReferredStudents = ambassadors.reduce((sum, a) => sum + a.totalReferrals, 0);

  // Filter ambassadors
  const filtered = ambassadors.filter((a) => {
    if (selectedCampus !== "ALL" && a.campusId !== selectedCampus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.fullName.toLowerCase().includes(q);
      const matchEmail = a.email.toLowerCase().includes(q);
      const matchCode = a.referralCode.toLowerCase().includes(q);
      return matchName || matchEmail || matchCode;
    }
    return true;
  });

  async function handleConfirmPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!payingAmbassador || payoutAmount <= 0) return;

    try {
      setProcessingPayout(true);
      const res = await fetch("/api/admin/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambassadorId: payingAmbassador.id,
          amount: payoutAmount,
          notes: payoutNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process payout");

      toast.success(data.message || "Payout recorded successfully!");

      // Update local state
      setAmbassadors((prev) =>
        prev.map((item) => {
          if (item.id === payingAmbassador.id) {
            return {
              ...item,
              pendingEarnings: Math.max(0, item.pendingEarnings - payoutAmount),
              paidEarnings: item.paidEarnings + payoutAmount,
            };
          }
          return item;
        })
      );

      setPayingAmbassador(null);
      setPayoutNotes("");
    } catch (err: any) {
      toast.error(err.message || "Payout processing failed");
    } finally {
      setProcessingPayout(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl">
          <span className="text-xs text-neutral-400 block mb-1">Total Ambassadors</span>
          <span className="text-2xl font-bold text-white">{ambassadors.length}</span>
          <span className="text-[11px] text-emerald-400 block mt-1">Across {campuses.length} universities</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl">
          <span className="text-xs text-neutral-400 block mb-1">Total Referrals</span>
          <span className="text-2xl font-bold text-emerald-400">{totalReferredStudents.toLocaleString()}</span>
          <span className="text-[11px] text-neutral-400 block mt-1">{totalRecruitedVendors} vendors onboarded</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl">
          <span className="text-xs text-neutral-400 block mb-1">Pending Management Payouts</span>
          <span className="text-2xl font-bold text-amber-400">₦{totalPendingPayouts.toLocaleString()}</span>
          <span className="text-[11px] text-neutral-400 block mt-1">Unpaid commissions</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl">
          <span className="text-xs text-neutral-400 block mb-1">Total Paid to Date</span>
          <span className="text-2xl font-bold text-teal-400">₦{totalPaidOut.toLocaleString()}</span>
          <span className="text-[11px] text-neutral-400 block mt-1">Direct student rewards</span>
        </div>
      </div>

      {/* Super Admin Control: Ambassador Earning Requests Lock */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              payoutRequestsLocked
                ? "bg-amber-950/80 border-amber-800/80 text-amber-400"
                : "bg-emerald-950/80 border-emerald-800/80 text-emerald-400"
            }`}
          >
            {payoutRequestsLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Ambassador Earning Request Button:
              </h2>
              <span
                className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                  payoutRequestsLocked
                    ? "bg-amber-950/80 text-amber-300 border-amber-800"
                    : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                }`}
              >
                {payoutRequestsLocked ? "Locked (Requests Disabled)" : "Unlocked (Requests Allowed)"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {payoutRequestsLocked
                ? "The 'Request Earnings' button is locked in ambassador dashboards. Ambassadors cannot submit payout requests until unlocked."
                : "Ambassadors with verified Nigerian bank accounts can request their pending referral earnings directly from their dashboard."}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isSuperAdmin ? (
            <Button
              type="button"
              disabled={togglingLock}
              onClick={handleTogglePayoutLock}
              className={`text-xs font-bold gap-1.5 px-4 h-10 rounded-xl transition-colors ${
                payoutRequestsLocked
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {togglingLock ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : payoutRequestsLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Request Button</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Lock Request Button</span>
                </>
              )}
            </Button>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-500 text-xs cursor-not-allowed"
              title="Super Administrator privilege required"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-600" />
              <span>Superadmin Control Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Referral Reward Rates Regulator */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Referral Reward Rates Regulator
              </h2>
              <p className="text-xs text-neutral-400">
                Regulate the cash bonus ambassadors earn per referral on their dashboard &amp; signups.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditingRates((prev) => !prev)}
            className="self-start sm:self-auto text-xs border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            {isEditingRates ? "Close Regulator" : "Regulate Referral Amounts"}
          </Button>
        </div>

        {/* Current Active Rates Display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 block font-medium">Vendor Referral Bounty</span>
              <span className="text-lg font-bold text-emerald-400">₦{rewardRates.vendorBonus.toLocaleString()}</span>
            </div>
            <Store className="w-4 h-4 text-emerald-500/60" />
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 block font-medium">Shopper / Buyer Bounty</span>
              <span className="text-lg font-bold text-teal-400">₦{rewardRates.buyerBonus.toLocaleString()}</span>
            </div>
            <Users className="w-4 h-4 text-teal-500/60" />
          </div>

          <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 block font-medium">Qualified Vendor Bonus</span>
              <span className="text-lg font-bold text-amber-400">₦{rewardRates.qualifiedVendorBonus.toLocaleString()}</span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500/60" />
          </div>
        </div>

        {/* Interactive Rate Editor Form */}
        {isEditingRates && (
          <form
            onSubmit={handleSaveRates}
            className="pt-4 border-t border-neutral-800 space-y-4 animate-in fade-in duration-200"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Vendor Bounty (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">₦</span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={vendorBonusInput}
                    onChange={(e) => setVendorBonusInput(e.target.value)}
                    className="pl-7 h-10 bg-neutral-950 border-neutral-700 text-xs text-white rounded-xl focus:border-emerald-500"
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Earned when a vendor registers with ambassador code
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Shopper Bounty (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">₦</span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={buyerBonusInput}
                    onChange={(e) => setBuyerBonusInput(e.target.value)}
                    className="pl-7 h-10 bg-neutral-950 border-neutral-700 text-xs text-white rounded-xl focus:border-emerald-500"
                    placeholder="e.g. 100"
                    required
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Earned when a student shopper signs up
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Qualified Vendor Bonus (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">₦</span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={qualifiedVendorBonusInput}
                    onChange={(e) => setQualifiedVendorBonusInput(e.target.value)}
                    className="pl-7 h-10 bg-neutral-950 border-neutral-700 text-xs text-white rounded-xl focus:border-emerald-500"
                    placeholder="e.g. 1000"
                    required
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Bonus unlocked once recruited vendor lists items
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetRates}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults (₦500 / ₦100 / ₦1,000)
              </button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditingRates(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingRates}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingRates ? "Saving Rates..." : "Save Reward Rates"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Super Admin Ambassador Hub Announcement Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                bannerConfig.enabled
                  ? "bg-purple-950/80 border-purple-800/80 text-purple-400"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400"
              }`}
            >
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Ambassador Hub Announcement Banner
                </h2>
                <span
                  className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                    bannerConfig.enabled
                      ? "bg-purple-950/80 text-purple-300 border-purple-800"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800"
                  }`}
                >
                  {bannerConfig.enabled ? "Active on Hub" : "Disabled / Inactive"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Broadcast critical updates, payment schedules, or guidelines directly on ambassadors&apos; dashboards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSuperAdmin ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingBanner((prev) => !prev)}
                  className="text-xs border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5 text-purple-400" />
                  {isEditingBanner ? "Close Editor" : "Write Banner"}
                </Button>

                <Button
                  type="button"
                  disabled={savingBanner}
                  onClick={handleToggleBannerActive}
                  className={`text-xs font-bold gap-1.5 px-3.5 h-9 rounded-xl transition-colors ${
                    bannerConfig.enabled
                      ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {savingBanner ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : bannerConfig.enabled ? (
                    <span>Disable Banner</span>
                  ) : (
                    <span>Activate Banner</span>
                  )}
                </Button>
              </>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-500 text-xs cursor-not-allowed"
                title="Super Administrator privilege required"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-600" />
                <span>Superadmin Control Only</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Active Banner Preview */}
        {bannerConfig.message ? (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              bannerConfig.type === "warning"
                ? "bg-amber-950/40 border-amber-800/80 text-amber-200"
                : bannerConfig.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
                : bannerConfig.type === "announcement"
                ? "bg-purple-950/40 border-purple-800/80 text-purple-200"
                : "bg-blue-950/40 border-blue-800/80 text-blue-200"
            }`}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider block">
                  {bannerConfig.title || "Ambassador Notice"} • Tone: {bannerConfig.type || "info"}
                </span>
                {bannerConfig.updatedAt && (
                  <span className="text-[10px] text-neutral-400">
                    Updated {new Date(bannerConfig.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm mt-0.5 leading-relaxed">{bannerConfig.message}</p>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 text-xs text-neutral-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-neutral-600 shrink-0" />
            <span>
              No announcement banner message has been written yet. Click &quot;Write Banner&quot; to publish important information to ambassadors.
            </span>
          </div>
        )}

        {/* Interactive Banner Editor Form (Superadmin only) */}
        {isEditingBanner && isSuperAdmin && (
          <form
            onSubmit={(e) => handleSaveBanner(e)}
            className="pt-4 border-t border-neutral-800 space-y-4 animate-in fade-in duration-200"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Banner Title (Optional Headline)
                </label>
                <Input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="h-10 bg-neutral-950 border-neutral-700 text-xs text-white rounded-xl focus:border-purple-500"
                  placeholder="e.g. End of Month Payout Notice / Campus Leaderboard Update"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Banner Style / Tone
                </label>
                <select
                  value={bannerType}
                  onChange={(e) => setBannerType(e.target.value as any)}
                  className="w-full h-10 px-3 bg-neutral-950 border border-neutral-700 text-xs text-white rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  <option value="announcement">Announcement (Purple / Highlight)</option>
                  <option value="info">Information (Blue / Notice)</option>
                  <option value="warning">Important / Warning (Amber)</option>
                  <option value="success">Success / Milestone (Emerald)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Banner Message Content *
              </label>
              <textarea
                value={bannerMessage}
                onChange={(e) => setBannerMessage(e.target.value)}
                rows={3}
                required
                className="w-full p-3 bg-neutral-950 border border-neutral-700 text-xs text-white rounded-xl focus:border-purple-500 focus:outline-none placeholder:text-neutral-600"
                placeholder="Write the announcement or instructions ambassadors should see on their dashboard..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bannerEnabledCheckbox"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 text-purple-600 focus:ring-purple-500 bg-neutral-950"
              />
              <label htmlFor="bannerEnabledCheckbox" className="text-xs text-neutral-300 cursor-pointer">
                Make banner visible on Ambassador Dashboard immediately upon saving
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditingBanner(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingBanner}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {savingBanner ? "Saving Banner..." : "Save Banner Content"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-neutral-900 border border-neutral-800 p-3.5 sm:p-4 rounded-2xl">
        <div className="w-full sm:w-auto">
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="w-full sm:w-64 h-10 px-3 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
          >
            <option value="ALL">All Universities ({ambassadors.length})</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
          <Input
            placeholder="Search ambassador or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 h-10 bg-neutral-800 border-neutral-700 text-xs text-white placeholder-neutral-500 rounded-xl"
          />
        </div>
      </div>

      {/* Ambassadors Section: Responsive Cards for Mobile & Clean Table for Desktop */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-sm">No campus ambassadors found.</div>
        ) : (
          <>
            {/* Mobile View: Clean Card List (< md) */}
            <div className="block md:hidden divide-y divide-neutral-800">
              {filtered.map((amb) => (
                <div key={amb.id} className="p-4 space-y-3.5 bg-neutral-900/60 hover:bg-neutral-900 transition-colors">
                  {/* Header: Name, Campus & Referral Code */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-sm truncate">{amb.fullName}</h4>
                      <p className="text-xs text-neutral-400 truncate">{amb.email}</p>
                      <span className="inline-block mt-1 text-[11px] text-emerald-400 font-medium">
                        {amb.campusName}
                      </span>
                    </div>
                    <div className="shrink-0 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-lg">
                      <span className="font-mono font-bold text-xs text-white tracking-wider">{amb.referralCode}</span>
                    </div>
                  </div>

                  {/* Performance & Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Signups</span>
                      <span className="font-bold text-white text-sm">{amb.totalReferrals}</span>
                      <span className="text-[11px] text-emerald-400 block">({amb.vendorCount} vendors)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Engagement</span>
                      <span className="font-bold text-white text-sm">{amb.totalClicks.toLocaleString()}</span>
                      <span className="text-[11px] text-neutral-400 block">clicks / scans</span>
                    </div>
                  </div>

                  {/* Earnings & Bank Details */}
                  <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Pending Commission</span>
                      <span className="text-sm font-bold text-amber-400">
                        ₦{amb.pendingEarnings.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-500 block">
                        Paid: ₦{amb.paidEarnings.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      {amb.bankAccountNumber ? (
                        <div>
                          <span className="text-white font-medium block text-xs">{amb.bankName}</span>
                          <span className="font-mono text-neutral-400 text-[11px]">{amb.bankAccountNumber}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-500 italic">No bank linked</span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-1">
                    <Button
                      size="sm"
                      disabled={amb.pendingEarnings <= 0 || !amb.bankAccountNumber}
                      onClick={() => {
                        setPayingAmbassador(amb);
                        setPayoutAmount(amb.pendingEarnings);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 rounded-xl shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      {amb.pendingEarnings > 0
                        ? `Pay Ambassador (₦${amb.pendingEarnings.toLocaleString()})`
                        : "No Pending Commission"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / Tablet Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm text-neutral-300">
                <thead className="bg-neutral-950 text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="py-3.5 px-6">Ambassador & School</th>
                    <th className="py-3.5 px-4">Referral Code</th>
                    <th className="py-3.5 px-4">Performance</th>
                    <th className="py-3.5 px-4">Bank Details</th>
                    <th className="py-3.5 px-4">Pending Commission</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filtered.map((amb) => (
                    <tr key={amb.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{amb.fullName}</div>
                        <div className="text-xs text-neutral-400">{amb.email}</div>
                        <span className="inline-block mt-1 text-[11px] text-emerald-400 font-medium">
                          {amb.campusName}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-white text-xs">
                        <span className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700">
                          {amb.referralCode}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs space-y-0.5">
                          <div>
                            <strong className="text-white">{amb.totalReferrals}</strong> signups (
                            <span className="text-emerald-400">{amb.vendorCount} vendors</span>)
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {amb.totalClicks.toLocaleString()} link clicks / scans
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {amb.bankAccountNumber ? (
                          <div className="text-xs">
                            <span className="text-white font-medium block">{amb.bankName}</span>
                            <span className="font-mono text-neutral-400">{amb.bankAccountNumber}</span>
                            <span className="block text-[11px] text-neutral-400 truncate max-w-[150px]">
                              {amb.bankAccountName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-500 italic">No bank linked</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-base font-bold text-amber-400 block">
                          ₦{amb.pendingEarnings.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          Paid: ₦{amb.paidEarnings.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          size="sm"
                          disabled={amb.pendingEarnings <= 0 || !amb.bankAccountNumber}
                          onClick={() => {
                            setPayingAmbassador(amb);
                            setPayoutAmount(amb.pendingEarnings);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 h-8 rounded-lg shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                          Pay Ambassador
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Payout Modal / Drawer */}
      {payingAmbassador && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-white space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Record Ambassador Payout
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Transfer to the student ambassador's verified bank account and record payment.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Ambassador:</span>
                <span className="font-semibold text-white">{payingAmbassador.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Bank:</span>
                <span className="font-semibold text-emerald-400">{payingAmbassador.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Account Number:</span>
                <span className="font-mono font-bold text-white">{payingAmbassador.bankAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Beneficiary:</span>
                <span className="font-semibold text-neutral-200">{payingAmbassador.bankAccountName}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayout} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Payout Amount (₦)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={payingAmbassador.pendingEarnings}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="bg-neutral-800 border-neutral-700 text-white font-mono font-bold text-base h-11"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Payment Reference / Narration
                </label>
                <Input
                  placeholder="e.g. November 2026 Ambassador Payout via Bank App"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-xs h-10"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPayingAmbassador(null)}
                  className="text-neutral-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processingPayout || payoutAmount <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4"
                >
                  {processingPayout ? "Recording..." : "Confirm & Mark as Paid"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
