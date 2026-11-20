"use client";

import * as React from "react";
import Link from "next/link";
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
  Sparkles,
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export function AmbassadorDashboardClient({
  initialAmbassador,
}: {
  initialAmbassador: AmbassadorData;
}) {
  const [ambassador, setAmbassador] = React.useState<AmbassadorData>(initialAmbassador);
  const [referrals, setReferrals] = React.useState<ReferralItem[]>([]);
  const [loadingReferrals, setLoadingReferrals] = React.useState(true);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Bank Form State
  const [banks, setBanks] = React.useState<BankItem[]>([]);
  const [selectedBankCode, setSelectedBankCode] = React.useState(ambassador.bankCode || "");
  const [selectedBankName, setSelectedBankName] = React.useState(ambassador.bankName || "");
  const [accountNumber, setAccountNumber] = React.useState(ambassador.bankAccountNumber || "");
  const [resolvedAccountName, setResolvedAccountName] = React.useState(ambassador.bankAccountName || "");
  const [resolvingBank, setResolvingBank] = React.useState(false);
  const [savingBank, setSavingBank] = React.useState(false);

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
  const vendorReferralUrl = `${origin}/vendor/register?ref=${ambassador.referralCode}`;
  const shopReferralUrl = `${origin}/shop?ref=${ambassador.referralCode}`;

  // Fetch referrals and banks on mount
  React.useEffect(() => {
    fetchReferrals();
    fetchBanks();
  }, []);

  async function fetchReferrals() {
    try {
      setLoadingReferrals(true);
      const res = await fetch("/api/ambassador/referrals");
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
      }
    } catch (err) {
      console.error("Failed to load referrals:", err);
    } finally {
      setLoadingReferrals(false);
    }
  }

  async function fetchBanks() {
    try {
      const res = await fetch("/api/ambassador/banks");
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks || []);
      }
    } catch (err) {
      console.error("Failed to load banks:", err);
    }
  }

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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/40 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                Verified Campus Ambassador
              </div>
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
            <span className="text-[11px] text-emerald-600/80 mt-1 block">₦500 bounty each</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-2">
              <span>Active Stores</span>
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-teal-700">{ambassador.stats.qualifiedVendors.toLocaleString()}</p>
            <span className="text-[11px] text-neutral-400 mt-1 block">Listed items</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-2">
              <span>Pending Payout</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">₦{ambassador.stats.pendingEarnings.toLocaleString()}</p>
            <span className="text-[11px] text-amber-600/80 mt-1 block">Awaiting cycle</span>
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
                  Earn ₦500 per vendor
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
                  Earn ₦100 per shopper
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
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-7 shadow-sm">
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
    </div>
  );
}
