"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Clock,
  User,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Activity,
  Layers,
  ShoppingBag,
  Sliders,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ActivityLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadataJson: string | null;
  ipAddress: string | null;
  createdAt: string | Date;
  user: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

interface AdminActivityTableProps {
  initialLogs: ActivityLogItem[];
}

export function AdminActivityTable({ initialLogs }: AdminActivityTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [inspectLog, setInspectLog] = useState<ActivityLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick stats
  const stats = useMemo(() => {
    const total = initialLogs.length;
    const vendorActions = initialLogs.filter((l) => l.action.startsWith("VENDOR_")).length;
    const userActions = initialLogs.filter((l) => l.action.startsWith("USER_")).length;
    const cmsActions = initialLogs.filter((l) =>
      l.action.includes("CMS") || l.action.includes("PAGE") || l.action.includes("HOMEPAGE")
    ).length;
    return { total, vendorActions, userActions, cmsActions };
  }, [initialLogs]);

  // Format date with exact time
  const formatDateTime = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      return { dateStr: "Unknown Date", timeStr: "--:--" };
    }

    const dateStr = d.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { dateStr, timeStr };
  };

  const getActionBadge = (action: string) => {
    const upper = action.toUpperCase();

    // Success / Approval (Green)
    if (
      upper.includes("APPROV") ||
      upper.includes("PUBLISH") ||
      upper.includes("CREATE") ||
      upper.includes("RESOLV") ||
      upper.includes("COMPLETE")
    ) {
      return (
        <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
          {action}
        </Badge>
      );
    }

    // Danger / Deletion / Suspension (Red)
    if (
      upper.includes("REJECT") ||
      upper.includes("DELET") ||
      upper.includes("SUSPEND") ||
      upper.includes("FLAG") ||
      upper.includes("CANCEL")
    ) {
      return (
        <Badge className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
          {action}
        </Badge>
      );
    }

    // Warnings / Role / Modifications (Amber)
    if (
      upper.includes("ROLE") ||
      upper.includes("UPDATE") ||
      upper.includes("CHANGE") ||
      upper.includes("REQUEST_INFO")
    ) {
      return (
        <Badge className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
          {action}
        </Badge>
      );
    }

    // CMS / Content (Purple)
    if (upper.includes("CMS") || upper.includes("HOMEPAGE") || upper.includes("PAGE")) {
      return (
        <Badge className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
          {action}
        </Badge>
      );
    }

    // Default / Neutral (Blue)
    return (
      <Badge className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">
        {action}
      </Badge>
    );
  };

  // Filter logs based on search term and category filter
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      // Category filter
      if (selectedCategory === "VENDORS" && !log.action.startsWith("VENDOR_")) return false;
      if (selectedCategory === "USERS" && !log.action.startsWith("USER_")) return false;
      if (selectedCategory === "PRODUCTS" && !log.action.startsWith("PRODUCT_")) return false;
      if (
        selectedCategory === "CMS" &&
        !(log.action.includes("CMS") || log.action.includes("HOMEPAGE") || log.action.includes("PAGE"))
      )
        return false;
      if (
        selectedCategory === "ORDERS" &&
        !(log.action.startsWith("ORDER_") || log.action.startsWith("ESCROW_") || log.action.startsWith("PAYMENT_"))
      )
        return false;

      // Search filter
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEntity = log.entityType.toLowerCase().includes(q) || (log.entityId && log.entityId.toLowerCase().includes(q));
      const matchUser =
        (log.user?.fullName && log.user.fullName.toLowerCase().includes(q)) ||
        (log.user?.email && log.user.email.toLowerCase().includes(q));
      const matchMetadata = log.metadataJson && log.metadataJson.toLowerCase().includes(q);

      return matchAction || matchEntity || matchUser || matchMetadata;
    });
  }, [initialLogs, searchTerm, selectedCategory]);

  const handleCopyJson = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider truncate">
              Total Log Entries
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 sm:mt-1">
              {stats.total}
            </h3>
            <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 truncate">
              Recorded in audit trail
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 text-emerald-400 bg-emerald-950/60 border-emerald-800/60">
            <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider truncate">
              Vendor Moderation
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 sm:mt-1">
              {stats.vendorActions}
            </h3>
            <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 truncate">
              Approvals & status shifts
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 text-blue-400 bg-blue-950/60 border-blue-800/60">
            <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider truncate">
              User & Role Changes
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 sm:mt-1">
              {stats.userActions}
            </h3>
            <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 truncate">
              Permissions & deletions
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 text-amber-400 bg-amber-950/60 border-amber-800/60">
            <User className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="p-3 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider truncate">
              CMS Publications
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 sm:mt-1">
              {stats.cmsActions}
            </h3>
            <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 truncate">
              Homepage & pages
            </p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 text-purple-400 bg-purple-950/60 border-purple-800/60">
            <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <Input
            placeholder="Search action, target ID, admin name, or metadata..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 h-10 text-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          {[
            { id: "ALL", label: "All Logs" },
            { id: "VENDORS", label: "Vendors" },
            { id: "USERS", label: "Users" },
            { id: "CMS", label: "CMS / Pages" },
            { id: "ORDERS", label: "Orders" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl font-semibold transition-colors shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Mobile Swipe Hint */}
        <div className="sm:hidden px-4 py-2 text-[11px] text-neutral-500 bg-neutral-950/40 border-b border-neutral-800 flex items-center justify-between">
          <span>Swipe horizontally to view full audit logs &rarr;</span>
          <span className="font-mono text-emerald-400">{filteredLogs.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/60 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Performed By</th>
                <th className="py-3.5 px-4">Audit Payload</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    <Activity className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-sm">No activity logs matched your criteria</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {searchTerm ? "Try searching for a different keyword or reset filters" : "Actions recorded by admins will appear here"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const { dateStr, timeStr } = formatDateTime(log.createdAt);
                  let parsedMetadata: any = null;
                  try {
                    if (log.metadataJson) {
                      parsedMetadata = JSON.parse(log.metadataJson);
                    }
                  } catch (e) {
                    parsedMetadata = log.metadataJson;
                  }

                  const avatarChar =
                    log.user?.fullName?.[0] || log.user?.email?.[0]?.toUpperCase() || "S";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-neutral-800/40 transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-white font-semibold">
                          {dateStr}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {timeStr}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Target Entity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">
                            {log.entityType}
                          </span>
                          {log.entityId && (
                            <span className="text-[10px] text-neutral-400 font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800">
                              #{log.entityId.slice(-6)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Performed By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {avatarChar}
                          </div>
                          <div>
                            <p className="font-bold text-white text-[11px] leading-tight">
                              {log.user ? log.user.fullName : "System Agent"}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono leading-none">
                              {log.user ? log.user.email : "AUTOMATED TASK"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Metadata Summary */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400 max-w-xs">
                        <div className="truncate bg-neutral-950/80 px-2.5 py-1.5 rounded-lg border border-neutral-800/80">
                          {parsedMetadata ? (
                            typeof parsedMetadata === "object" ? (
                              JSON.stringify(parsedMetadata)
                            ) : (
                              String(parsedMetadata)
                            )
                          ) : (
                            <span className="text-neutral-600">No additional parameters</span>
                          )}
                        </div>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setInspectLog(log)}
                          className="h-8 px-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold gap-1 rounded-xl"
                        >
                          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                          Inspect
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

      {/* Inspection Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-5 text-neutral-200 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">
                    Audit Log Inspection
                  </h3>
                  {getActionBadge(inspectLog.action)}
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  Event ID: <span className="text-white">{inspectLog.id}</span>
                </p>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <div>
                <span className="text-neutral-500 block">Target Entity:</span>
                <strong className="text-white">
                  {inspectLog.entityType}
                  {inspectLog.entityId && ` (${inspectLog.entityId})`}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Timestamp:</span>
                <strong className="text-white font-mono">
                  {new Date(inspectLog.createdAt).toLocaleString("en-NG")}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Actor:</span>
                <strong className="text-white">
                  {inspectLog.user ? inspectLog.user.fullName : "System Agent"}{" "}
                  <span className="text-neutral-400 font-normal">
                    ({inspectLog.user ? inspectLog.user.role : "AUTOMATED"})
                  </span>
                </strong>
              </div>
              <div>
                <span className="text-neutral-500 block">IP Address:</span>
                <strong className="text-white font-mono">
                  {inspectLog.ipAddress || "Internal Server / Secure Sandbox"}
                </strong>
              </div>
            </div>

            {/* JSON Payload Inspector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  Recorded Metadata Payload
                </span>
                {inspectLog.metadataJson && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyJson(inspectLog.metadataJson || "{}")}
                    className="h-7 text-xs text-neutral-400 hover:text-white gap-1 rounded-lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Raw JSON
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-words">
                  {(() => {
                    try {
                      if (inspectLog.metadataJson) {
                        return JSON.stringify(JSON.parse(inspectLog.metadataJson), null, 2);
                      }
                      return "// No metadata was attached to this event.";
                    } catch (e) {
                      return inspectLog.metadataJson || "// Raw string payload";
                    }
                  })()}
                </pre>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <Button
                size="sm"
                onClick={() => setInspectLog(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold px-5"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
