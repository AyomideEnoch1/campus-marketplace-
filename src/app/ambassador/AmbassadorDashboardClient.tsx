"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  Users,
  Store,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  Lock,
  Unlock,
  Send,
  Loader2,
  Megaphone,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AmbassadorBannerConfig } from "@/lib/referral";

interface AmbassadorData {
  id: string;
  referralCode: string;
  status: string;
  whatsapp?: string | null;
  bio?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  bankVerified?: boolean;
  payoutRequestsLocked?: boolean;
  bannerConfig?: AmbassadorBannerConfig;
  activePayoutRequest?: {
    id: string;
    amount: number;
    status: string;
    reference: string;
    createdAt: string;
  } | null;
  campus: {
    id: string;
    name: string;
    city: string;
  };
  stats: {
    totalReferrals: number;
    totalVendors: number;
    qualifiedVendors: number;
    totalBuyers: number;
    totalClicks: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
  };
}

interface ReferralItem {
  id: string;
  roleAtSignup: string;
  isQualified: boolean;
  rewardAmount: number;
  rewardStatus: string;
  createdAt: string;
  referredUser: {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
    vendorProfile?: {
      id: string;
      storeName: string;
      status: string;
      slug: string;
      _count: { products: number };
    } | null;
  };
}

interface BankItem {
  id: number | string;
  code: string;
  name: string;
}

export interface ReferralRewardRates {
  vendorBonus: number;
  buyerBonus: number;
  qualifiedVendorBonus: number;
}

export function AmbassadorDashboardClient({
  initialAmbassador,
  rewardConfig = { vendorBonus: 500, buyerBonus: 100, qualifiedVendorBonus: 1000 },
}: {
  initialAmbassador: AmbassadorData;
  rewardConfig?: ReferralRewardRates;
}) {
  const [ambassador, setAmbassador] = React.useState<AmbassadorData>(initialAmbassador);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  const { data: referralsData, isLoading: loadingReferrals } = useQuery({
    queryKey: ["ambassador", "referrals", initialAmbassador.id],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/ambassador/referrals", { signal });
      if (!res.ok) throw new Error("Failed to load referrals");
      const data = await res.json();
      return (data.referrals || []) as ReferralItem[];
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: banksData } = useQuery({
    queryKey: ["ambassador", "banks"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/ambassador/banks", { signal });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.banks || []) as BankItem[];
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const referrals = referralsData || [];
  const banks = banksData || [];

  // Bank Form State
  const [selectedBankCode, setSelectedBankCode] = React.useState(ambassador.bankCode || "");
  const [selectedBankName, setSelectedBankName] = React.useState(ambassador.bankName || "");
  const [accountNumber, setAccountNumber] = React.useState(ambassador.bankAccountNumber || "");
  const [resolvedAccountName, setResolvedAccountName] = React.useState(ambassador.bankAccountName || "");
  const [resolvingBank, setResolvingBank] = React.useState(false);
  const [savingBank, setSavingBank] = React.useState(false);

  // Earning Payout Request State (Super Admin Lockable)
  const [payoutRequestsLocked, setPayoutRequestsLocked] = React.useState<boolean>(
    Boolean(initialAmbassador.payoutRequestsLocked)
  );
  const [activePayoutRequest, setActivePayoutRequest] = React.useState<any>(
    initialAmbassador.activePayoutRequest || null
  );
  const [showRequestPayoutModal, setShowRequestPayoutModal] = React.useState(false);
  const [requestingPayout, setRequestingPayout] = React.useState(false);
  const [customPayoutAmount, setCustomPayoutAmount] = React.useState<string>("");
  const [payoutNotesInput, setPayoutNotesInput] = React.useState("");

  // Filter and Search State
  const [filterRole, setFilterRole] = React.useState<"ALL" | "VENDOR" | "BUYER">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");

  const qrCanvasRef = React.useRef<HTMLDivElement>(null);

  // Origin for links
  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralUrl = `${origin}/auth/register?ref=${ambassador.referralCode}`;
  const vendorReferralUrl = `${origin}/auth/register?role=vendor&ref=${ambassador.referralCode}`;
  const shopReferralUrl = `${origin}/shop?ref=${ambassador.referralCode}`;

  function handleCopy(text: string, type: "link" | "code") {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Referral link copied to clipboard!");
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success("Referral code copied!");
    }
  }

  // Resolve Bank Account Name
  async function handleResolveBank() {
    if (!selectedBankCode) {
      toast.error("Please select your bank");
      return;
    }
    if (!accountNumber || accountNumber.trim().length !== 10) {
      toast.error("Please enter a valid 10-digit account number");
      return;
    }

    try {
      setResolvingBank(true);
      const res = await fetch("/api/ambassador/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode: selectedBankCode, accountNumber: accountNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resolve bank account");

      setResolvedAccountName(data.accountName);
      toast.success(`Account verified: ${data.accountName}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to verify account");
    } finally {
      setResolvingBank(false);
    }
  }

  // Save Bank Details
  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedAccountName) {
      toast.error("Please verify your account details before saving");
      return;
    }

    try {
      setSavingBank(true);
      const res = await fetch("/api/ambassador/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankCode: selectedBankCode,
          bankName: selectedBankName,
          accountNumber: accountNumber.trim(),
          accountName: resolvedAccountName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save bank details");

      setAmbassador((prev) => ({
        ...prev,
        bankAccountName: resolvedAccountName,
        bankAccountNumber: accountNumber.trim(),
        bankCode: selectedBankCode,
        bankName: selectedBankName,
        bankVerified: true,
      }));
      toast.success("Bank account successfully linked for payouts!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save bank account");
    } finally {
      setSavingBank(false);
    }
  }

  // Refresh Ambassador Profile & Lock Status
  async function fetchProfile() {
    try {
      const res = await fetch("/api/ambassador/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.ambassador) {
          setAmbassador(data.ambassador);
          setPayoutRequestsLocked(Boolean(data.ambassador.payoutRequestsLocked));
          setActivePayoutRequest(data.ambassador.activePayoutRequest || null);
        }
      }
    } catch (err) {
      console.error("Failed to refresh ambassador profile:", err);
    }
  }

  // Submit Earning Payout Request
  async function handleSubmitPayoutRequest(e: React.FormEvent) {
    e.preventDefault();

    if (payoutRequestsLocked) {
      toast.error("Earnings accumulate throughout the week and cash out weekly.");
      return;
    }

    if (!ambassador.bankVerified || !ambassador.bankAccountNumber) {
      toast.error("Please verify and link your Nigerian bank account before requesting earnings.");
      return;
    }

    const amountNum = customPayoutAmount.trim()
      ? Number(customPayoutAmount)
      : ambassador.stats.pendingEarnings;

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid payout amount.");
      return;
    }

    if (amountNum > ambassador.stats.pendingEarnings) {
      toast.error("Requested amount cannot exceed your available pending earnings.");
      return;
    }

    try {
      setRequestingPayout(true);
      const res = await fetch("/api/ambassador/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          notes: payoutNotesInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit payout request");

      toast.success(data.message || "Payout request submitted successfully!");
      setActivePayoutRequest(data.payout);
      setShowRequestPayoutModal(false);
      setCustomPayoutAmount("");
      setPayoutNotesInput("");

      // Refresh profile to reflect any updated state
      fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payout request");
    } finally {
      setRequestingPayout(false);
    }
  }

  // Download High-Resolution Branded QR Flyer (PNG)
  function handleDownloadFlyer() {
    try {
      const qrCanvas = qrCanvasRef.current?.querySelector("canvas");
      if (!qrCanvas) {
        toast.error("QR Code canvas not found");
        return;
      }

      // Create high-res canvas (800 x 1000)
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 1000);
      grad.addColorStop(0, "#064e3b"); // Deep emerald
      grad.addColorStop(0.5, "#047857");
      grad.addColorStop(1, "#065f46");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 1000);

      // Card Container
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(40, 50, 720, 900, 24);
      ctx.fill();

      // Header Tag
      ctx.fillStyle = "#ecfdf5";
      ctx.beginPath();
      ctx.roundRect(240, 90, 320, 44, 22);
      ctx.fill();
      ctx.fillStyle = "#059669";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CAMPUS AMBASSADOR", 400, 118);

      // Main Title
      ctx.fillStyle = "#111827";
      ctx.font = "bold 38px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Shop & Sell Safely", 400, 185);

      // Subtitle
      ctx.fillStyle = "#059669";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(`on ${ambassador.campus.name}`, 400, 225);

      // Instructions
      ctx.fillStyle = "#6b7280";
      ctx.font = "18px sans-serif";
      ctx.fillText("Scan this code to join ọjà & browse verified student stores", 400, 265);

      // QR Code Background Border
      ctx.fillStyle = "#f9fafb";
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(175, 305, 450, 450, 20);
      ctx.fill();
      ctx.stroke();

      // Draw QR Code
      ctx.drawImage(qrCanvas, 200, 330, 400, 400);

      // Referral Code Box
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(160, 785, 480, 70, 16);
      ctx.fill();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.fillText("AMBASSADOR CODE", 400, 810);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px monospace";
      ctx.fillText(ambassador.referralCode, 400, 842);

      // Footer
      ctx.fillStyle = "#9ca3af";
      ctx.font = "15px sans-serif";
      ctx.fillText("Escrow Protected • Verified Student IDs • Instant Payouts", 400, 910);

      // Trigger Download
      const link = document.createElement("a");
      link.download = `ọjà-${ambassador.referralCode}-Flyer.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Branded Ambassador Flyer downloaded!");
    } catch (err) {
      console.error("Failed to generate flyer:", err);
      toast.error("Could not generate flyer download");
    }
  }

  // Filtered referrals
  const filteredReferrals = referrals.filter((r) => {
    if (filterRole !== "ALL" && r.roleAtSignup !== filterRole) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = r.referredUser.fullName.toLowerCase().includes(query);
      const matchEmail = r.referredUser.email.toLowerCase().includes(query);
      const matchStore = r.referredUser.vendorProfile?.storeName.toLowerCase().includes(query);
      return matchName || matchEmail || matchStore;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ambassador Hub — {ambassador.campus.name}
              </h1>
              <p className="mt-1 text-emerald-100 text-sm sm:text-base max-w-2xl">
                Empower your fellow students to buy and sell safely on campus. Track your referrals,
                monitor earnings, and receive payouts directly to your bank account.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-center">
                <span className="text-xs text-emerald-200 block">Referral Code</span>
                <span className="text-xl font-mono font-bold tracking-wider">{ambassador.referralCode}</span>
              </div>
              <Button
                onClick={() => handleCopy(ambassador.referralCode, "code")}
                variant="outline"
                className="bg-white text-emerald-900 hover:bg-emerald-50 border-none font-semibold shadow-sm"
              >
                {copiedCode ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                Copy Code
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Super Admin Announcement Banner */}
        {ambassador.bannerConfig?.enabled && ambassador.bannerConfig?.message && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border shadow-xs relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              ambassador.bannerConfig.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-950"
                : ambassador.bannerConfig.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : ambassador.bannerConfig.type === "announcement"
                ? "bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200 text-purple-950"
                : "bg-blue-50 border-blue-200 text-blue-950"
            }`}
          >
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  ambassador.bannerConfig.type === "warning"
                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                    : ambassador.bannerConfig.type === "success"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : ambassador.bannerConfig.type === "announcement"
                    ? "bg-purple-100 text-purple-700 border border-purple-300"
                    : "bg-blue-100 text-blue-700 border border-blue-300"
                }`}
              >
                {ambassador.bannerConfig.type === "warning" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : ambassador.bannerConfig.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : ambassador.bannerConfig.type === "announcement" ? (
                  <Megaphone className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider ${
                      ambassador.bannerConfig.type === "warning"
                        ? "text-amber-800"
                        : ambassador.bannerConfig.type === "success"
                        ? "text-emerald-800"
                        : ambassador.bannerConfig.type === "announcement"
                        ? "text-purple-800"
                        : "text-blue-800"
                    }`}
                  >
                    {ambassador.bannerConfig.title || "Campus Leadership Announcement"}
                  </span>
                  {ambassador.bannerConfig.updatedAt && (
                    <span className="text-[11px] text-neutral-500 font-medium">
                      Posted {new Date(ambassador.bannerConfig.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm sm:text-base leading-relaxed text-neutral-800 font-medium whitespace-pre-line">
                  {ambassador.bannerConfig.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-2">
              <span>Link Clicks</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{ambassador.stats.totalClicks.toLocaleString()}</p>
            <span className="text-[11px] text-neutral-400 mt-1 block">Visits & Scans</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-2">
              <span>Total Signups</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{ambassador.stats.totalReferrals.toLocaleString()}</p>
            <span className="text-[11px] text-neutral-400 mt-1 block">Verified accounts</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-2">
              <span>Vendors Recruited</span>
              <Store className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">{ambassador.stats.totalVendors.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-600/80 mt-1 block">
              ₦{rewardConfig.vendorBonus.toLocaleString()} bounty each
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-2">
              <span>Active Stores</span>
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-teal-700">{ambassador.stats.qualifiedVendors.toLocaleString()}</p>
            <span className="text-[11px] text-neutral-400 mt-1 block">Listed items</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1.5">
                <span>Pending Payout</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600">₦{ambassador.stats.pendingEarnings.toLocaleString()}</p>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">Unwithdrawn earnings</span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-neutral-100">
              {payoutRequestsLocked ? (
                <button
                  type="button"
                  disabled
                  title="Earnings accumulate throughout the week and cash out weekly"
                  className="w-full text-[11px] font-bold py-1.5 px-2 bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>Weekly Cashout</span>
                </button>
              ) : activePayoutRequest ? (
                <div className="w-full py-1.5 px-2 bg-blue-50 border border-blue-200 text-blue-700 text-center text-[11px] font-bold rounded-lg flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 animate-pulse text-blue-600" />
                  <span>In Review (₦{Number(activePayoutRequest.amount).toLocaleString()})</span>
                </div>
              ) : !ambassador.bankVerified ? (
                <button
                  type="button"
                  onClick={() => {
                    const bankEl = document.getElementById("bank-details-section");
                    bankEl?.scrollIntoView({ behavior: "smooth" });
                    toast.info("Please verify your Nigerian bank account first.");
                  }}
                  className="w-full text-[11px] font-bold py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>Verify Bank First</span>
                </button>
              ) : ambassador.stats.pendingEarnings <= 0 ? (
                <button
                  type="button"
                  disabled
                  className="w-full text-[11px] font-semibold py-1.5 px-2 bg-neutral-100 text-neutral-400 rounded-lg cursor-not-allowed text-center"
                >
                  <span>No Earnings</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCustomPayoutAmount(String(ambassador.stats.pendingEarnings));
                    setShowRequestPayoutModal(true);
                  }}
                  className="w-full text-[11px] font-bold py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Request Earnings</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-2">
              <span>Total Earned</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">₦{ambassador.stats.totalEarnings.toLocaleString()}</p>
            <span className="text-[11px] text-neutral-400 mt-1 block">Lifetime commission</span>
          </div>
        </div>

        {/* Weekly Payout Schedule Banner */}
        {payoutRequestsLocked && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200/80 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-amber-950">
                  Weekly Payout Schedule
                </p>
                <p className="text-[11px] sm:text-xs text-amber-800/90 mt-0.5">
                  Earnings accumulate throughout the week and are cashed out weekly.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[10px] uppercase font-mono font-bold px-2.5 py-1 bg-amber-200/60 border border-amber-300 rounded-full text-amber-900 shrink-0">
              Weekly Cashout
            </span>
          </div>
        )}

        {/* Earning Payout Request Action Panel */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  Referral Earning Payouts
                </h2>
                {ambassador.bankVerified ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified: {ambassador.bankName} (••••{ambassador.bankAccountNumber?.slice(-4)})
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Bank Not Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Withdraw your accumulated student buyer and vendor recruitment earnings directly to your verified Nigerian bank account.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="text-right sm:pr-2 hidden sm:block">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold">
                Available to Request
              </span>
              <span className="text-xl font-black text-emerald-700">
                ₦{ambassador.stats.pendingEarnings.toLocaleString()}
              </span>
            </div>

            {payoutRequestsLocked ? (
              <Button
                type="button"
                disabled
                className="bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed font-bold text-xs h-11 px-5 rounded-xl gap-2"
                title="Earnings accumulate throughout the week and cash out weekly"
              >
                <Clock className="w-4 h-4 text-neutral-400" />
                <span>Weekly Cashout</span>
              </Button>
            ) : activePayoutRequest ? (
              <div className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 animate-pulse text-blue-600" />
                <span>
                  Payout Request in Review (₦{Number(activePayoutRequest.amount).toLocaleString()})
                </span>
              </div>
            ) : !ambassador.bankVerified ? (
              <Button
                type="button"
                onClick={() => {
                  const bankEl = document.getElementById("bank-details-section");
                  bankEl?.scrollIntoView({ behavior: "smooth" });
                  toast.info("Please verify and link your Nigerian bank account first.");
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-11 px-5 rounded-xl gap-2 shadow-xs"
              >
                <Building className="w-4 h-4" />
                <span>Verify Bank to Request</span>
              </Button>
            ) : ambassador.stats.pendingEarnings <= 0 ? (
              <Button
                type="button"
                disabled
                className="bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed font-bold text-xs h-11 px-5 rounded-xl"
              >
                <span>No Pending Earnings</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setCustomPayoutAmount(String(ambassador.stats.pendingEarnings));
                  setShowRequestPayoutModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-11 px-6 rounded-xl shadow-md gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Request Earnings (₦{ambassador.stats.pendingEarnings.toLocaleString()})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Share & QR Code Generation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Referral Links Hub */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-7 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                Your Referral Links
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Share your links across WhatsApp groups, hostel chats, or departmental channels.
                Visitors get a 30-day tracking cookie attached automatically.
              </p>
            </div>

            {/* Main Universal Link */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Primary Student Link (Auto-detects Buyer / Vendor)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={referralUrl}
                  className="bg-neutral-50 text-neutral-800 text-sm font-mono border-neutral-300"
                />
                <Button
                  onClick={() => handleCopy(referralUrl, "link")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                  {copiedLink ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Quick Share to WhatsApp */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Share Directly to WhatsApp</p>
                <p className="text-xs text-emerald-700">Broadcast your link with a pre-written invite message</p>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hey! Use my student ambassador link to buy and sell safely on ${ambassador.campus.name} with escrow protection: ${referralUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                Share to WhatsApp
              </a>
            </div>

            {/* Direct Targeted Sub-Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="border border-neutral-200 rounded-xl p-4 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-emerald-600" />
                    Vendor Registration Link
                  </span>
                  <button
                    onClick={() => handleCopy(vendorReferralUrl, "link")}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mb-2 truncate font-mono bg-neutral-50 p-1.5 rounded">
                  {vendorReferralUrl}
                </p>
                <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                  Earn ₦{rewardConfig.vendorBonus.toLocaleString()} per vendor
                </span>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Campus Shop Link
                  </span>
                  <button
                    onClick={() => handleCopy(shopReferralUrl, "link")}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mb-2 truncate font-mono bg-neutral-50 p-1.5 rounded">
                  {shopReferralUrl}
                </p>
                <span className="text-[11px] text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded font-medium">
                  Earn ₦{rewardConfig.buyerBonus.toLocaleString()} per shopper
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic QR Code & Flyer Generator */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  Ambassador QR Code
                </h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                  Live
                </span>
              </div>
              <p className="text-xs text-neutral-500 mb-6">
                Students can scan this directly from your phone screen or printed flyers to register under your code.
              </p>

              {/* QR Code Container */}
              <div
                ref={qrCanvasRef}
                className="bg-neutral-50 border-2 border-dashed border-emerald-300/80 rounded-2xl p-6 flex flex-col items-center justify-center mx-auto max-w-[260px] shadow-inner"
              >
                <QRCodeCanvas
                  value={referralUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/favicon.ico",
                    x: undefined,
                    y: undefined,
                    height: 28,
                    width: 28,
                    excavate: true,
                  }}
                />
                <span className="mt-3 font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-md">
                  {ambassador.referralCode}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100">
              <Button
                onClick={handleDownloadFlyer}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Branded Flyer (PNG)
              </Button>
              <p className="text-[11px] text-neutral-400 text-center mt-2">
                Ready to post on WhatsApp Status or print for your faculty notice boards
              </p>
            </div>
          </div>
        </div>

        {/* Bank Account Linking for Payouts */}
        <div id="bank-details-section" className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                Bank Account for Ambassador Payouts
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Link your personal Nigerian bank account. Management pays out accumulated ambassador commissions
                directly into this account.
              </p>
            </div>
            {ambassador.bankVerified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified for Payouts
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBank} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1.5">
                Bank Name
              </label>
              <select
                value={selectedBankCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setSelectedBankCode(code);
                  const found = banks.find((b) => b.code === code);
                  if (found) setSelectedBankName(found.name);
                  setResolvedAccountName("");
                }}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select your bank...</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1.5">
                10-Digit Account Number
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  maxLength={10}
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, ""));
                    setResolvedAccountName("");
                  }}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResolveBank}
                  disabled={resolvingBank || accountNumber.length !== 10 || !selectedBankCode}
                  className="shrink-0 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {resolvingBank ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1.5">
                Account Holder Name
              </label>
              <Input
                readOnly
                placeholder="Click Verify above"
                value={resolvedAccountName}
                className="bg-neutral-50 font-semibold text-sm text-neutral-800"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end pt-2">
              <Button
                type="submit"
                disabled={savingBank || !resolvedAccountName}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
              >
                {savingBank ? "Saving..." : "Save Bank Account"}
              </Button>
            </div>
          </form>
        </div>

        {/* Referred Students Roster Table */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Referred Students & Vendors
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Real-time log of users who signed up using your link or code
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-neutral-100 p-1 rounded-xl">
                <button
                  onClick={() => setFilterRole("ALL")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterRole === "ALL" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  All ({referrals.length})
                </button>
                <button
                  onClick={() => setFilterRole("VENDOR")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterRole === "VENDOR" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Vendors ({referrals.filter((r) => r.roleAtSignup === "VENDOR").length})
                </button>
                <button
                  onClick={() => setFilterRole("BUYER")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    filterRole === "BUYER" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Shoppers ({referrals.filter((r) => r.roleAtSignup === "BUYER").length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search name or store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs w-48"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loadingReferrals ? (
            <div className="p-12 text-center text-neutral-400 text-sm">Loading your referrals...</div>
          ) : filteredReferrals.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-sm font-semibold text-neutral-700">No referrals found</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Start sharing your referral link on your campus WhatsApp groups and status to get your first signups!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                  <tr>
                    <th className="py-3.5 px-6">Student / Store</th>
                    <th className="py-3.5 px-4">Account Type</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4">Activity Status</th>
                    <th className="py-3.5 px-6 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/70">
                  {filteredReferrals.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-900">{item.referredUser.fullName}</div>
                        {item.referredUser.vendorProfile && (
                          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                            <Store className="w-3.5 h-3.5" />
                            {item.referredUser.vendorProfile.storeName}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {item.roleAtSignup === "VENDOR" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Vendor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                            Shopper
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-neutral-500">
                        {new Date(item.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-4">
                        {item.roleAtSignup === "VENDOR" ? (
                          item.isQualified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Store Active ({item.referredUser.vendorProfile?._count.products || 0} items)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                              <Clock className="w-3.5 h-3.5" />
                              Pending 1st Product
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-neutral-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Registered
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-semibold text-neutral-900">₦{item.rewardAmount.toLocaleString()}</span>
                        <span className="block text-[11px] text-neutral-400 capitalize">{item.rewardStatus.toLowerCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request Payout Confirmation Modal */}
      {showRequestPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-neutral-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">Request Referral Earnings</h3>
                  <p className="text-xs text-neutral-500">Submit payout request to platform management</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestPayoutModal(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayoutRequest} className="space-y-4">
              {/* Destination Bank Account Summary */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Payout Destination Bank
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Bank:</span>
                  <span className="font-bold text-neutral-900">{ambassador.bankName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Account Number:</span>
                  <span className="font-mono font-bold text-neutral-900">{ambassador.bankAccountNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Account Name:</span>
                  <span className="font-semibold text-emerald-700">{ambassador.bankAccountName}</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700">Amount to Request (₦)</label>
                  <span className="text-[11px] text-neutral-500">
                    Available: <strong className="text-emerald-600">₦{ambassador.stats.pendingEarnings.toLocaleString()}</strong>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-neutral-400">₦</span>
                  <Input
                    type="number"
                    min="1"
                    max={ambassador.stats.pendingEarnings}
                    value={customPayoutAmount}
                    onChange={(e) => setCustomPayoutAmount(e.target.value)}
                    required
                    className="pl-8 pr-16 h-11 font-mono font-bold text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomPayoutAmount(String(ambassador.stats.pendingEarnings))}
                    className="absolute right-2.5 top-2.5 px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-[11px] font-bold text-neutral-700"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Notes (Optional)</label>
                <Input
                  type="text"
                  placeholder="e.g. November referral earnings"
                  value={payoutNotesInput}
                  onChange={(e) => setPayoutNotesInput(e.target.value)}
                  maxLength={150}
                  className="text-xs h-10"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Once submitted, management reviews the request and disburses the funds directly to your verified bank account.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestPayoutModal(false)}
                  disabled={requestingPayout}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={requestingPayout || !customPayoutAmount || Number(customPayoutAmount) <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 h-10"
                >
                  {requestingPayout ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm Payout Request"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
