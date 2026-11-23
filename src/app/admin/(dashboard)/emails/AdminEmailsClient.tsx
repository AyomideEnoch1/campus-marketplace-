"use client";

import * as React from "react";
import {
  Mail,
  RefreshCw,
  Search,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  templateId: string;
  status: "SENT" | "FAILED" | "SIMULATED" | "BOUNCED" | string;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt: string | Date;
  createdAt: string | Date;
}

interface SuppressionItem {
  id: string;
  email: string;
  reason: string;
  details?: string | null;
  createdAt: string | Date;
}

interface AdminEmailsClientProps {
  initialLogs: EmailLogItem[];
  totalLogs: number;
  initialStats: {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  };
  initialSuppressions: SuppressionItem[];
  adminEmail: string;
}

const TEMPLATE_OPTIONS = [
  // Super Admin
  { id: "admin_new_vendor_pending", label: "Admin: New Vendor Registration Alert" },
  { id: "admin_kyc_submission", label: "Admin: Vendor KYC Submitted" },
  { id: "admin_new_dispute", label: "Admin: Critical Escrow Dispute Opened" },
  { id: "admin_payout_failed", label: "Admin: Bank Payout Transfer Failed" },
  { id: "admin_security_alert", label: "Admin: Security Role Change Alert" },
  { id: "admin_daily_digest", label: "Admin: 24h Daily Executive Digest" },

  // Vendors
  { id: "vendor_registration_received", label: "Vendor: Registration Received" },
  { id: "vendor_status_update", label: "Vendor: Account Approved / Suspended" },
  { id: "vendor_new_order", label: "Vendor: New Escrow Order Received" },
  { id: "vendor_order_cancelled", label: "Vendor: Order Cancelled" },
  { id: "vendor_dispute_opened", label: "Vendor: Buyer Dispute Opened" },
  { id: "vendor_product_moderation", label: "Vendor: Product Approved / Moderated" },
  { id: "vendor_stock_alert", label: "Vendor: Low / Out of Stock Warning" },
  { id: "vendor_payout_status", label: "Vendor: Bank Payout Sent / Failed" },
  { id: "vendor_new_review", label: "Vendor: New Customer Review Received" },

  // Buyers
  { id: "buyer_welcome", label: "Buyer: Welcome to ọjà" },
  { id: "buyer_email_verification", label: "Buyer: Email 6-Digit Verification Code" },
  { id: "buyer_password_reset", label: "Buyer: Password Reset Link" },
  { id: "buyer_password_changed", label: "Buyer: Password Changed Alert" },
  { id: "buyer_new_login", label: "Buyer: New Login Device Alert" },
  { id: "buyer_order_confirmation", label: "Buyer: Order Confirmation & Handover Code" },
  { id: "buyer_order_shipped", label: "Buyer: Order Ready for Pickup / Shipped" },
  { id: "buyer_order_delivered", label: "Buyer: Order Delivered & Escrow Released" },
  { id: "buyer_dispute_update", label: "Buyer: Dispute Update & Refund Issued" },
  { id: "buyer_abandoned_cart", label: "Buyer: Abandoned Bag Reminder" },
];

export function AdminEmailsClient({
  initialLogs,
  totalLogs,
  initialStats,
  initialSuppressions,
  adminEmail,
}: AdminEmailsClientProps) {
  const [logs, setLogs] = React.useState<EmailLogItem[]>(initialLogs);
  const [stats, setStats] = React.useState(initialStats);
  const [suppressions, setSuppressions] = React.useState(initialSuppressions);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [loading, setLoading] = React.useState(false);
  const [resendingId, setResendingId] = React.useState<string | null>(null);

  // Test Sender State
  const [selectedTemplate, setSelectedTemplate] = React.useState(TEMPLATE_OPTIONS[0].id);
  const [testEmail, setTestEmail] = React.useState(adminEmail);
  const [sendingTest, setSendingTest] = React.useState(false);
  const [processingQueue, setProcessingQueue] = React.useState(false);

  // Fetch / refresh email logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/emails?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load emails");

      setLogs(data.logs || []);
      if (data.queueStats) setStats(data.queueStats);
      if (data.suppressions) setSuppressions(data.suppressions);
    } catch (err: any) {
      toast.error(err.message || "Could not fetch email logs");
    } finally {
      setLoading(false);
    }
  };

  // Trigger immediate queue processing
  const handleProcessQueue = async () => {
    setProcessingQueue(true);
    try {
      const res = await fetch("/api/cron/process-email-queue", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Queue processing error");

      toast.success(
        `Queue batch completed: ${data.summary?.succeeded || 0} sent, ${data.summary?.failed || 0} failed.`
      );
      fetchLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger queue processing");
    } finally {
      setProcessingQueue(false);
    }
  };

  // Re-send an email
  const handleResend = async (logId: string) => {
    setResendingId(logId);
    try {
      const res = await fetch("/api/admin/emails/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");

      toast.success("Email queued for immediate re-delivery!");
      fetchLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to resend email");
    } finally {
      setResendingId(null);
    }
  };

  // Send sample test email
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid recipient email.");
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/emails/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          recipientEmail: testEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send test email");

      toast.success(data.message || "Test email dispatched successfully!");
      fetchLogs();
    } catch (err: any) {
      toast.error(err.message || "Error sending test email");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Transactional Email Engine &amp; Queue
            </h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold">
              Resend Verified
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Central event bus, outbox background queue, delivery audits, and bounce suppression.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleProcessQueue}
            disabled={processingQueue}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processingQueue ? "animate-spin" : ""}`} />
            <span>Process Queue Now</span>
          </Button>

          <Button
            onClick={fetchLogs}
            disabled={loading}
            variant="outline"
            className="border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold gap-2"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Pending in Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.pending}</div>
          <div className="text-[11px] text-neutral-500">Awaiting background dispatch</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Processing</span>
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.processing}</div>
          <div className="text-[11px] text-neutral-500">Currently in transport</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Total Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.sent}</div>
          <div className="text-[11px] text-neutral-500">Successful notifications</div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Failed / Backoff</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{stats.failed}</div>
          <div className="text-[11px] text-neutral-500">Scheduled for retry</div>
        </div>
      </div>

      {/* Test Sample Email Sender Box */}
      <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white">Live Sample Email Tester</h2>
          </div>
          <span className="text-[11px] text-neutral-400">Preview &amp; verify template rendering</span>
        </div>

        <form onSubmit={handleSendTest} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-bold text-neutral-300">Choose Notification Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-bold text-neutral-300">Recipient Email Address</label>
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="e.g. your-email@gmail.com"
              className="bg-neutral-950 border-neutral-800 text-white text-xs h-10 rounded-xl"
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={sendingTest}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl gap-1.5"
            >
              {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Sample</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Email Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
            placeholder="Search recipient, subject, or template ID..."
            className="pl-9 bg-neutral-900 border-neutral-800 text-white text-xs rounded-xl h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "SENT", "FAILED", "SIMULATED", "BOUNCED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setTimeout(fetchLogs, 50);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === st
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/70 text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Template ID / Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sent At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-neutral-500">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No email logs found</p>
                    <p className="text-[11px] mt-0.5">Transactional events will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSent = log.status === "SENT";
                  const isFailed = log.status === "FAILED";
                  const isBounced = log.status === "BOUNCED";
                  const isSim = log.status === "SIMULATED";

                  return (
                    <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white max-w-[200px] truncate">
                        {log.recipient}
                      </td>

                      <td className="py-3 px-4 max-w-[280px]">
                        <div className="font-semibold text-neutral-200 truncate">{log.subject}</div>
                        <div className="text-[11px] font-mono text-emerald-400/80">{log.templateId}</div>
                        {log.error && (
                          <div className="text-[11px] text-rose-400 font-medium truncate mt-0.5" title={log.error}>
                            Error: {log.error}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                            isSent
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : isFailed
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                              : isBounced
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {log.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                        {new Date(log.sentAt || log.createdAt).toLocaleString("en-NG", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => handleResend(log.id)}
                          disabled={resendingId === log.id}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg gap-1.5"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${resendingId === log.id ? "animate-spin" : ""}`} />
                          <span>Resend</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suppression List (Bounces & Complaints) */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-extrabold text-white">Suppressed Addresses (Bounces &amp; Complaints)</h2>
        </div>
        <p className="text-xs text-neutral-400">
          The email engine automatically rejects outbound dispatches to these addresses to preserve domain sender reputation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {suppressions.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-neutral-500">
              No suppressed email addresses. Deliverability health is 100%.
            </div>
          ) : (
            suppressions.map((sup) => (
              <div
                key={sup.id}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center justify-between"
              >
                <div className="truncate mr-2">
                  <span className="font-mono text-neutral-200 block truncate">{sup.email}</span>
                  <span className="text-[10px] text-neutral-500">{sup.details || "Bounced"}</span>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] uppercase font-bold shrink-0">
                  {sup.reason}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
