"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  Lock,
  History,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";

const DEFAULT_BANKS = [
  { id: 1, code: "044", name: "Access Bank" },
  { id: 2, code: "023", name: "Citibank" },
  { id: 3, code: "050", name: "Ecobank Nigeria" },
  { id: 4, code: "070", name: "Fidelity Bank" },
  { id: 5, code: "011", name: "First Bank of Nigeria" },
  { id: 6, code: "214", name: "First City Monument Bank (FCMB)" },
  { id: 7, code: "058", name: "Guaranty Trust Bank (GTBank)" },
  { id: 8, code: "030", name: "Heritage Bank" },
  { id: 9, code: "301", name: "Jaiz Bank" },
  { id: 10, code: "082", name: "Keystone Bank" },
  { id: 11, code: "50211", name: "Kuda Bank" },
  { id: 12, code: "999991", name: "OPay Digital Services" },
  { id: 13, code: "999992", name: "PalmPay" },
  { id: 14, code: "101", name: "Providus Bank" },
  { id: 15, code: "221", name: "Stanbic IBTC Bank" },
  { id: 16, code: "068", name: "Standard Chartered Bank" },
  { id: 17, code: "232", name: "Sterling Bank" },
  { id: 18, code: "100", name: "Suntrust Bank" },
  { id: 19, code: "032", name: "Union Bank of Nigeria" },
  { id: 20, code: "033", name: "United Bank for Africa (UBA)" },
  { id: 21, code: "215", name: "Unity Bank" },
  { id: 22, code: "035", name: "Wema Bank" },
  { id: 23, code: "057", name: "Zenith Bank" },
];

export default function VendorWalletPage() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["vendor", "wallet"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/vendor/wallet", { signal });
      if (!res.ok) throw new Error("Failed to load vendor wallet");
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: banksData } = useQuery({
    queryKey: ["vendor", "bank-list"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/vendor/bank/list", { signal });
      if (!res.ok) return { banks: DEFAULT_BANKS };
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const banks: any[] = (banksData?.banks && banksData.banks.length > 0) ? banksData.banks : DEFAULT_BANKS;

  // Bank setup state
  const [selectedBankCode, setSelectedBankCode] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [resolvingName, setResolvingName] = React.useState(false);
  const [resolvedResult, setResolvedResult] = React.useState<any>(null);
  const [savingBank, setSavingBank] = React.useState(false);
  const [bankSaveSuccess, setBankSaveSuccess] = React.useState(false);

  // Delivery code verification modal
  const [verifyModalOpen, setVerifyModalOpen] = React.useState(false);
  const [orderIdToVerify, setOrderIdToVerify] = React.useState("");
  const [enteredCode, setEnteredCode] = React.useState("");
  const [submittingCode, setSubmittingCode] = React.useState(false);
  const [codeSuccessMsg, setCodeSuccessMsg] = React.useState<string | null>(null);
  const [codeErrorMsg, setCodeErrorMsg] = React.useState<string | null>(null);

  const fetchWallet = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["vendor", "wallet"] });
  }, [queryClient]);

  // Sync bank form fields once wallet data arrives
  React.useEffect(() => {
    if (data?.bankAccount?.bankCode && !selectedBankCode) {
      setSelectedBankCode(data.bankAccount.bankCode);
    }
    if (data?.bankAccount?.accountNumber && !accountNumber) {
      setAccountNumber(data.bankAccount.accountNumber);
    }
  }, [data?.bankAccount?.bankCode, data?.bankAccount?.accountNumber]);

  // Live Bank Resolution when 10 digits and bankCode chosen (with AbortController)
  React.useEffect(() => {
    if (accountNumber.length !== 10 || !selectedBankCode) return;
    const controller = new AbortController();
    setResolvingName(true);
    setResolvedResult(null);

    fetch("/api/vendor/bank/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        bankCode: selectedBankCode,
        accountNumber,
        save: false,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setResolvedResult(res);
        } else {
          setResolvedResult({ error: res.error || "Could not resolve bank account" });
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setResolvedResult({ error: "Network error resolving account details" });
        }
      })
      .finally(() => {
        setResolvingName(false);
      });

    return () => controller.abort();
  }, [accountNumber, selectedBankCode]);

  const handleSaveBank = async () => {
    if (!selectedBankCode || !accountNumber || accountNumber.length !== 10) return;
    setSavingBank(true);
    try {
      const res = await fetch("/api/vendor/bank/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankCode: selectedBankCode,
          accountNumber,
          save: true,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save bank account");

      setBankSaveSuccess(true);
      fetchWallet();
      setTimeout(() => setBankSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingBank(false);
    }
  };

  const handleVerifyDeliveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdToVerify || !enteredCode) return;
    setSubmittingCode(true);
    setCodeSuccessMsg(null);
    setCodeErrorMsg(null);

    try {
      const res = await fetch("/api/escrow/verify-delivery-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderIdToVerify.trim(),
          code: enteredCode.trim(),
          deliveryCode: enteredCode.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Delivery code verification failed");
      }

      setCodeSuccessMsg(resData.message || "Code verified! Order confirmed for payout.");
      setEnteredCode("");
      fetchWallet();
    } catch (err: any) {
      setCodeErrorMsg(err.message || "Failed to verify code");
    } finally {
      setSubmittingCode(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500">Loading vendor wallet &amp; payouts...</p>
        </div>
      </div>
    );
  }

  const balances = data?.balances || { pendingEscrow: 0, availablePayout: 0, totalPaidOut: 0 };
  const currentBank = data?.bankAccount;
  const isBankVerified = currentBank?.verified;

  return (
    <div className="min-h-screen bg-neutral-50/70 py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight flex items-center gap-2.5">
              <Wallet className="w-7 h-7 text-emerald-600" />
              <span>Seller Escrow Wallet</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Track pending escrow funds, payout delays, bank account settlement, and transfer history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setVerifyModalOpen(true)}
              className="rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Enter Buyer Delivery Code</span>
            </Button>
            <Button
              onClick={() => fetchWallet()}
              variant="outline"
              size="sm"
              className="rounded-xl border-neutral-300"
              title="Refresh Wallet"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-600" />
            </Button>
          </div>
        </div>

        {/* 1. Wallet Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Pending Escrow */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pending in Escrow</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-neutral-950">
              {formatNGN(balances.pendingEscrow)}
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              Held safely in escrow while buyers inspect orders or delivery is underway.
            </p>
          </div>

          {/* Card 2: Available for Payout */}
          <div className="p-6 rounded-3xl bg-white border border-emerald-500/30 bg-emerald-50/20 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Available for Payout</span>
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-700">
              {formatNGN(balances.availablePayout)}
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              Confirmed delivery where release delay has passed. Ready for bank transfer.
            </p>
          </div>

          {/* Card 3: Total Paid Out */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Paid Out</span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-3xl font-black text-neutral-950">
              {formatNGN(balances.totalPaidOut)}
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              Total lifetime funds transferred into your verified Nigerian bank account.
            </p>
          </div>
        </div>

        {/* 2. Bank Account Settlement Setup */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-neutral-950 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <span>Payout Bank Account Details</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                All confirmed escrow earnings are transferred directly to this Nigerian bank account via Flutterwave Transfers.
              </p>
            </div>

            {isBankVerified ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Bank Account Verified
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold">
                Verification Required
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Select Bank */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-neutral-800 block">Select Nigerian Bank:</label>
              <select
                value={selectedBankCode}
                onChange={(e) => {
                  setSelectedBankCode(e.target.value);
                  setResolvedResult(null);
                }}
                className="w-full p-3 rounded-2xl border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-xs font-semibold"
              >
                <option value="">-- Choose your bank --</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-neutral-800 block">10-Digit NUBAN Account Number:</label>
              <div className="relative">
                <Input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 0123456789"
                  value={accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setAccountNumber(val);
                  }}
                  className="rounded-2xl text-xs font-mono font-bold pr-10"
                />
                {resolvingName && (
                  <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin absolute right-3 top-3" />
                )}
              </div>
            </div>
          </div>

          {/* Resolved Name Preview */}
          {resolvedResult && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1 transition-all ${
              resolvedResult.error
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : resolvedResult.nameMatches
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-amber-50 border-amber-300 text-amber-900"
            }`}>
              {resolvedResult.error ? (
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {resolvedResult.error}
                </p>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-600">Account Name (from Bank):</span>
                    <span className="font-mono font-black text-sm uppercase">
                      {resolvedResult.accountName}
                    </span>
                  </div>
                  {resolvedResult.nameMatches ? (
                    <p className="text-[11px] text-emerald-700 font-semibold pt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Name matches your registered seller account. Verified for automatic payouts.
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-800 pt-1 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      Name does not closely match your registered ID name ({resolvedResult.legalName}). Small spelling variations will require admin confirmation.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-neutral-400">
              🔒 Changing bank details updates your payout profile and requires re-validation.
            </p>
            <Button
              onClick={handleSaveBank}
              disabled={savingBank || !selectedBankCode || accountNumber.length !== 10}
              className="w-full sm:w-auto rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 shadow-md"
            >
              {savingBank ? "Saving Bank Details..." : bankSaveSuccess ? "Bank Saved ✓" : "Save Payout Bank Account"}
            </Button>
          </div>
        </div>

        {/* 3. Payout History & Append-Only Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Payout History */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 space-y-4">
            <h3 className="font-black text-sm text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span>Flutterwave Payout Transfers</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">
                {data?.payouts?.length || 0} Transfers
              </span>
            </h3>

            {data?.payouts && data.payouts.length > 0 ? (
              <div className="space-y-3 divide-y divide-neutral-100 text-xs">
                {data.payouts.map((payout: any) => (
                  <div key={payout.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900">
                          {formatNGN(payout.amount)}
                        </span>
                        <Badge className={`text-[10px] font-bold ${
                          payout.status === "successful"
                            ? "bg-emerald-100 text-emerald-800"
                            : payout.status === "failed"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {payout.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        Ref: {payout.reference}
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-neutral-500">
                      <span>{new Date(payout.createdAt).toLocaleDateString()}</span>
                      {payout.failureReason && (
                        <p className="text-[10px] text-rose-600 line-clamp-1 max-w-[180px]">
                          {payout.failureReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400">
                No bank payouts recorded yet.
              </div>
            )}
          </div>

          {/* Append-Only Escrow Ledger Audit */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 space-y-4">
            <h3 className="font-black text-sm text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span>Append-Only Escrow Ledger</span>
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                Immutable
              </span>
            </h3>

            {data?.ledgerEntries && data.ledgerEntries.length > 0 ? (
              <div className="space-y-2.5 divide-y divide-neutral-100 text-[11px]">
                {data.ledgerEntries.map((entry: any) => (
                  <div key={entry.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase ${
                        entry.type === "escrow_in"
                          ? "bg-emerald-100 text-emerald-800"
                          : entry.type === "escrow_out"
                          ? "bg-blue-100 text-blue-800"
                          : entry.type === "commission"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-neutral-100 text-neutral-800"
                      }`}>
                        {entry.type}
                      </span>
                      <p className="text-neutral-700 font-medium line-clamp-1 mt-0.5">
                        {entry.description || entry.reference}
                      </p>
                    </div>
                    <span className="font-bold text-neutral-900 shrink-0 font-mono">
                      {entry.type === "escrow_out" ? "-" : "+"}
                      {formatNGN(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400">
                No ledger activity recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Verify Delivery Code Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-neutral-950 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Enter Buyer Delivery Code</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verify buyer's 6-digit code after physical hand-off
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyDeliveryCode} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">Order ID or Number:</label>
                <Input
                  required
                  placeholder="e.g. ord_123 or CT-481923"
                  value={orderIdToVerify}
                  onChange={(e) => setOrderIdToVerify(e.target.value)}
                  className="rounded-2xl"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">Buyer's 6-Digit Code:</label>
                <Input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ""))}
                  className="rounded-2xl text-center font-mono text-2xl font-black tracking-widest"
                />
              </div>

              {codeSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold">
                  ✓ {codeSuccessMsg}
                </div>
              )}

              {codeErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold">
                  ⚠ {codeErrorMsg}
                </div>
              )}

              <p className="text-[11px] text-neutral-400">
                You have a maximum of 5 attempts. Entering the correct code confirms delivery and unlocks your payout release.
              </p>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={submittingCode || enteredCode.length !== 6 || !orderIdToVerify}
                  className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {submittingCode ? "Verifying..." : "Verify & Confirm Hand-Off"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVerifyModalOpen(false)}
                  className="rounded-2xl border-neutral-300"
                >
                  Close
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
