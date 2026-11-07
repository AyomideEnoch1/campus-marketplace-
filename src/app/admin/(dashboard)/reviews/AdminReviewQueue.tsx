"use client";

import * as React from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle,
  EyeOff,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface ReviewModerationItem {
  id: string;
  rating: number;
  comment?: string | null;
  tags?: string | null;
  status: string;
  helpfulCount: number;
  createdAt: string;
  product: { id: string; title: string; slug: string };
  buyer: { fullName: string; email: string };
  seller: { storeName: string };
  reports: { id: string; reason: string; details?: string | null; reporter: { fullName: string } }[];
}

export function AdminReviewQueue({ initialReviews }: { initialReviews: ReviewModerationItem[] }) {
  const [reviews, setReviews] = React.useState(initialReviews);
  const [filterStatus, setFilterStatus] = React.useState("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const filtered = reviews.filter((r) => {
    const matchesSearch =
      r.product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.buyer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.comment && r.comment.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === "ALL"
        ? true
        : filterStatus === "REPORTED"
        ? r.reports.length > 0
        : r.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleModerate = async (reviewId: string, action: string) => {
    setLoadingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (action === "DELETE") {
          setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        } else {
          const newStatus = action === "PUBLISH" || action === "DISMISS_REPORTS" ? "PUBLISHED" : "HIDDEN";
          setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status: string, reportCount: number) => {
    if (reportCount > 0) {
      return (
        <Badge className="bg-red-950 text-red-400 border border-red-800 text-[10px]">
          {reportCount} {reportCount === 1 ? "Report" : "Reports"}
        </Badge>
      );
    }
    if (status === "PUBLISHED") {
      return <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">Published</Badge>;
    }
    if (status === "FLAGGED") {
      return <Badge className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">Flagged</Badge>;
    }
    return <Badge className="bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px]">Hidden</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search reviews by product, student buyer, or text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "REPORTED", "FLAGGED", "HIDDEN", "PUBLISHED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === st
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Moderation List / Cards */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            No reviews matching moderation filter.
          </div>
        ) : (
          filtered.map((r) => {
            const isLoading = loadingId === r.id;
            return (
              <div key={r.id} className="p-5 space-y-3 hover:bg-neutral-800/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-white text-xs">{r.product.title}</span>
                    <Link
                      href={`/product/${r.product.slug}`}
                      target="_blank"
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(r.status, r.reports.length)}
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                  {r.comment || <em className="text-neutral-600">No written feedback provided.</em>}
                </div>

                {/* Buyer & Seller Info */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 gap-2">
                  <span>
                    By: <strong className="text-neutral-200">{r.buyer.fullName}</strong> ({r.buyer.email}) &bull; Seller: <strong className="text-neutral-200">{r.seller.storeName}</strong>
                  </span>

                  {/* Moderation Controls */}
                  <div className="flex items-center gap-1.5">
                    {r.reports.length > 0 && (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleModerate(r.id, "DISMISS_REPORTS")}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] h-7 px-2.5 rounded-lg"
                      >
                        Dismiss Reports
                      </Button>
                    )}

                    {r.status !== "PUBLISHED" ? (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleModerate(r.id, "PUBLISH")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7 px-2.5 rounded-lg gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Publish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleModerate(r.id, "HIDE")}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] h-7 px-2.5 rounded-lg gap-1"
                      >
                        <EyeOff className="w-3 h-3" /> Hide
                      </Button>
                    )}

                    <Button
                      size="sm"
                      disabled={isLoading}
                      onClick={() => handleModerate(r.id, "DELETE")}
                      className="bg-neutral-800 hover:bg-red-950/80 text-neutral-400 hover:text-red-400 text-[10px] h-7 px-2.5 rounded-lg"
                      title="Permanently Delete Review"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Attached Reports Details */}
                {r.reports.length > 0 && (
                  <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl space-y-1.5 text-xs">
                    <p className="font-bold text-red-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      Submitted Reports:
                    </p>
                    {r.reports.map((rep) => (
                      <div key={rep.id} className="text-[11px] text-red-200/90 pl-5">
                        &bull; Reason: <strong>{rep.reason}</strong> by {rep.reporter.fullName}
                        {rep.details && ` — "${rep.details}"`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
