"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Activity,
  Layers,
  RefreshCw,
  Search,
  ArrowRight,
  Split,
  User,
  AlertCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNGN } from "@/lib/utils";
import { toast } from "sonner";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

export default function AdminEscrowPage() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["admin", "escrow"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/admin/escrow", { signal });
      if (!res.ok) throw new Error("Failed to load admin escrow console");
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const error = queryError ? (queryError as Error).message : null;

  // Split dispute modal
  const [splitModalOpen, setSplitModalOpen] = React.useState(false);
  const [activeDispute, setActiveDispute] = React.useState<any>(null);
  const [refundShare, setRefundShare] = React.useState<number>(0);
  const [sellerShare, setSellerShare] = React.useState<number>(0);
  const [splitNotes, setSplitNotes] = React.useState("");
  const [resolvingAction, setResolvingAction] = React.useState(false);

  // Payout retry state
  const [retryingPayoutId, setRetryingPayoutId] = React.useState<string | null>(null);
  const [reconciling, setReconciling] = React.useState(false);

  // Flutterwave Checkout Restriction Toggle
  const { isFlutterwaveLocked, refetch: refetchSettings } = usePlatformSettings();
  const [togglingFlutterwave, setTogglingFlutterwave] = React.useState(false);

  const handleToggleFlutterwave = async () => {
    setTogglingFlutterwave(true);
    const nextState = isFlutterwaveLocked; // true = unlock, false = lock
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable_flutterwave_checkout: String(nextState) }),
      });
      if (res.ok) {
        await refetchSettings();
        toast.success(
          nextState
            ? "Flutterwave Live Checkout UNLOCKED: Customers can pay online with cards/transfer."
            : "Flutterwave Live Checkout RESTRICTED: Locked modal enabled."
        );
      } else {
        toast.error("Failed to update Flutterwave restriction setting");
      }
    } catch {
      toast.error("Network error updating Flutterwave setting");
    } finally {
      setTogglingFlutterwave(false);
    }
  };

  const fetchAdminData = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "escrow"] });
  }, [queryClient]);

  const handleResolveDispute = async (
    disputeId: string,
    resolution: "refund" | "release" | "split",
    extraData?: any
  ) => {
    setResolvingAction(true);
    try {
      const res = await fetch("/api/disputes/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId,
          resolution,
          resolutionNotes: extraData?.notes || `Admin resolution: ${resolution}`,
          refundAmount: extraData?.refundAmount || 0,
          sellerReleaseAmount: extraData?.sellerReleaseAmount || 0,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to resolve dispute");

      alert(`Dispute successfully resolved: ${resJson.message}`);
      setSplitModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolvingAction(false);
    }
  };

  const handleRetryPayout = async (orderId: string) => {
    setRetryingPayoutId(orderId);
    try {
      const res = await fetch("/api/escrow/release-funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, forceAdminRelease: true }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to retry payout");

      alert(`Payout re-attempted: ${resJson.message}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRetryingPayoutId(null);
    }
  };

  const handleRunReconciliation = async () => {
    setReconciling(true);
    try {
      const res = await fetch("/api/cron/reconcile-transfers", { method: "POST" });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Reconciliation failed");

      alert(`Reconciliation Completed!\nStuck Payouts Rechecked: ${resJson.stuckPayoutsChecked}\nDeficit Warning: ${resJson.reconciliationAudit?.isLowBalanceWarning ? "YES - DEFICIT" : "NONE (BALANCED)"}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReconciling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500">Loading admin escrow overview...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="min-h-screen bg-neutral-50/70 py-8 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
              <span>Platform Escrow &amp; Payouts Console</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Flutterwave Transfers control room, dispute mediator, low balance auditor, and append-only ledger logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleToggleFlutterwave}
              disabled={togglingFlutterwave}
              variant="outline"
              title={
                !isFlutterwaveLocked
                  ? "Live Flutterwave checkout is active across the shop. Click to restrict."
                  : "Flutterwave checkout is restricted (compliance modal active). Click to unlock live checkout."
              }
              className={`rounded-2xl font-bold text-xs gap-1.5 shadow-sm transition-all ${
                !isFlutterwaveLocked
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  !isFlutterwaveLocked ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {!isFlutterwaveLocked ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>Live Checkout: {!isFlutterwaveLocked ? "ACTIVE (LIVE)" : "LOCKED (ONBOARDING)"}</span>
            </Button>

            <Button
              onClick={handleRunReconciliation}
              disabled={reconciling}
              className="rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs gap-1.5 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? "animate-spin" : ""}`} />
              <span>Run Transfer Reconciliation</span>
            </Button>
            <Button
              onClick={fetchAdminData}
              variant="outline"
              size="sm"
              className="rounded-xl border-neutral-300"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-600" />
            </Button>
          </div>
        </div>

        {/* Low Balance Warning Banner */}
        {metrics.isLowBalanceWarning && (
          <div className="p-4 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start justify-between gap-4 animate-in fade-in-50">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-rose-950">
                  Critical Flutterwave Balance Deficit Warning
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
                  Platform escrow liabilities ({formatNGN(metrics.activeEscrowHeld)}) exceed your available Flutterwave merchant balance ({formatNGN(metrics.flwAvailableBalance)}). Deficit: <strong>{formatNGN(metrics.deficitAmount)}</strong>. Fund your Flutterwave merchant account immediately to prevent transfer payout failures.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Active Escrow Held</span>
            <div className="text-2xl font-black text-emerald-700">{formatNGN(metrics.activeEscrowHeld)}</div>
            <p className="text-[10px] text-neutral-400">Total funds pending customer delivery confirmation</p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Flutterwave Balance</span>
            <div className={`text-2xl font-black ${metrics.isLowBalanceWarning ? "text-rose-600" : "text-neutral-950"}`}>
              {formatNGN(metrics.flwAvailableBalance)}
            </div>
            <p className="text-[10px] text-neutral-400">Live merchant balance from Flutterwave GET /balances</p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Lifetime Payouts Released</span>
            <div className="text-2xl font-black text-neutral-950">{formatNGN(metrics.totalEscrowOut)}</div>
            <p className="text-[10px] text-neutral-400">Total transfers paid out to verified vendor accounts</p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-xs space-y-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Platform Commission</span>
            <div className="text-2xl font-black text-purple-700">{formatNGN(metrics.totalCommission)}</div>
            <p className="text-[10px] text-neutral-400">Retained 3-5% marketplace commission</p>
          </div>
        </div>

        {/* 2. Active Disputes Panel */}
        <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="font-black text-base text-neutral-950 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>Active Escrow Disputes ({data?.disputes?.length || 0})</span>
            </h3>
            <span className="text-xs text-neutral-400">Frozen until admin resolution</span>
          </div>

          {data?.disputes && data.disputes.length > 0 ? (
            <div className="space-y-4">
              {data.disputes.map((dispute: any) => {
                const orderAmount = dispute.order.subtotal || dispute.order.totalAmount;
                return (
                  <div key={dispute.id} className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-neutral-900 text-sm">
                            Order #{dispute.order.orderNumber}
                          </span>
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
                            {dispute.reason.replace(/_/g, " ")}
                          </Badge>
                          <span className="font-extrabold text-neutral-900">
                            {formatNGN(orderAmount)}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          Buyer: <strong>{dispute.buyer?.fullName || "Buyer"}</strong> ({dispute.buyer?.email}) &bull; Vendor: <strong>{dispute.order.vendor?.storeName}</strong>
                        </p>
                      </div>

                      {/* Action Buttons: Refund, Release, Split */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={resolvingAction}
                          onClick={() => handleResolveDispute(dispute.id, "refund")}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                        >
                          Refund Buyer (100%)
                        </Button>
                        <Button
                          size="sm"
                          disabled={resolvingAction}
                          onClick={() => handleResolveDispute(dispute.id, "release")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                        >
                          Release to Seller (100%)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveDispute(dispute);
                            setRefundShare(Math.round(orderAmount / 2));
                            setSellerShare(orderAmount - Math.round(orderAmount / 2));
                            setSplitModalOpen(true);
                          }}
                          className="border-neutral-300 text-neutral-800 font-bold text-xs rounded-xl"
                        >
                          <Split className="w-3.5 h-3.5 mr-1" /> Split
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-neutral-200/80 text-neutral-700">
                      <span className="font-bold text-neutral-900 block mb-0.5">Buyer's Claim:</span>
                      <p className="italic">{dispute.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-neutral-400">
              No active disputes pending mediator action.
            </div>
          )}
        </div>

        {/* 3. Failed Payouts Queue & Webhook Audit Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Failed Payouts Queue */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 space-y-4">
            <h3 className="font-black text-sm text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Failed Payout Queue</span>
              </span>
              <span className="text-xs text-neutral-400">
                {data?.failedPayouts?.length || 0} Stuck
              </span>
            </h3>

            {data?.failedPayouts && data.failedPayouts.length > 0 ? (
              <div className="space-y-3 divide-y divide-neutral-100 text-xs">
                {data.failedPayouts.map((fp: any) => (
                  <div key={fp.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900">
                          {formatNGN(fp.amount)}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          Order #{fp.order?.orderNumber}
                        </span>
                        <Badge className="bg-rose-100 text-rose-800 text-[10px]">
                          Attempt #{fp.attempts}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-rose-700 mt-0.5 line-clamp-1">
                        Reason: {fp.failureReason || "Bank network rejected"}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      disabled={retryingPayoutId === fp.orderId}
                      onClick={() => handleRetryPayout(fp.orderId)}
                      className="rounded-xl text-xs font-bold bg-neutral-900 text-white shrink-0"
                    >
                      {retryingPayoutId === fp.orderId ? "Retrying..." : "Retry Payout"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-neutral-400">
                No failed payouts in queue.
              </div>
            )}
          </div>

          {/* Webhook Events Log */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-neutral-200/90 shadow-xs p-6 space-y-4">
            <h3 className="font-black text-sm text-neutral-900 border-b border-neutral-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Flutterwave Webhook Audit Log</span>
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                Idempotent
              </span>
            </h3>

            {data?.webhookLogs && data.webhookLogs.length > 0 ? (
              <div className="space-y-2 text-[11px] font-mono">
                {data.webhookLogs.map((log: any) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-neutral-900">{log.eventType}</span>
                      <p className="text-[10px] text-neutral-400">ID: {log.eventId}</p>
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(log.processedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-neutral-400">
                No webhooks logged yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Split Resolution Modal */}
      {splitModalOpen && activeDispute && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 text-xs">
            <h3 className="text-base font-black text-neutral-900">
              Split Funds for Order #{activeDispute.order.orderNumber}
            </h3>
            <p className="text-neutral-500">
              Total Order Amount: <strong>{formatNGN(activeDispute.order.subtotal || activeDispute.order.totalAmount)}</strong>
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="font-bold text-neutral-800 block mb-1">Buyer Refund Amount (₦):</label>
                <Input
                  type="number"
                  value={refundShare}
                  onChange={(e) => {
                    const r = Number(e.target.value) || 0;
                    const total = activeDispute.order.subtotal || activeDispute.order.totalAmount;
                    setRefundShare(r);
                    setSellerShare(Math.max(0, total - r));
                  }}
                  className="rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">Seller Release Amount (₦):</label>
                <Input
                  type="number"
                  value={sellerShare}
                  onChange={(e) => {
                    const s = Number(e.target.value) || 0;
                    const total = activeDispute.order.subtotal || activeDispute.order.totalAmount;
                    setSellerShare(s);
                    setRefundShare(Math.max(0, total - s));
                  }}
                  className="rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">Mediation Notes:</label>
                <textarea
                  rows={3}
                  value={splitNotes}
                  onChange={(e) => setSplitNotes(e.target.value)}
                  placeholder="Reason for split settlement..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                disabled={resolvingAction || refundShare <= 0 || sellerShare <= 0}
                onClick={() =>
                  handleResolveDispute(activeDispute.id, "split", {
                    refundAmount: refundShare,
                    sellerReleaseAmount: sellerShare,
                    notes: splitNotes,
                  })
                }
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Confirm Split Payout &amp; Refund
              </Button>
              <Button
                variant="outline"
                onClick={() => setSplitModalOpen(false)}
                className="rounded-xl border-neutral-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
