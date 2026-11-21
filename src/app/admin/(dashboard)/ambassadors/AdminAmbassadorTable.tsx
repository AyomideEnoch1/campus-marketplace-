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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

export function AdminAmbassadorTable({
  initialAmbassadors,
  campuses,
}: {
  initialAmbassadors: AmbassadorItem[];
  campuses: CampusItem[];
}) {
  const [ambassadors, setAmbassadors] = React.useState<AmbassadorItem[]>(initialAmbassadors);
  const [search, setSearch] = React.useState("");
  const [selectedCampus, setSelectedCampus] = React.useState("ALL");
  const [payingAmbassador, setPayingAmbassador] = React.useState<AmbassadorItem | null>(null);
  const [payoutAmount, setPayoutAmount] = React.useState<number>(0);
  const [payoutNotes, setPayoutNotes] = React.useState("");
  const [processingPayout, setProcessingPayout] = React.useState(false);

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
