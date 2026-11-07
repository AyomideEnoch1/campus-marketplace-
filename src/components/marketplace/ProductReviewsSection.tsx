"use client";

import * as React from "react";
import Image from "next/image";
import {
  Star,
  ThumbsUp,
  ShieldCheck,
  Flag,
  MessageCircle,
  Camera,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewFormModal } from "./ReviewFormModal";
import { formatDate } from "@/lib/utils";

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  tags: string[];
  photos: string[];
  helpfulCount: number;
  hasVotedHelpful: boolean;
  createdAt: string;
  displayName: string;
  isVerifiedPurchase: boolean;
  isAuthor: boolean;
  canEdit: boolean;
  reply?: {
    id: string;
    body: string;
    createdAt: string;
    storeName: string;
    storeLogo?: string | null;
  } | null;
}

interface ProductReviewsSectionProps {
  productId: string;
  productTitle: string;
  productImage?: string;
  sellerId: string;
  sellerStoreName: string;
  isSeller: boolean;
}

export function ProductReviewsSection({
  productId,
  productTitle,
  productImage,
  sellerId,
  sellerStoreName,
  isSeller,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [avgRating, setAvgRating] = React.useState(0);
  const [breakdown, setBreakdown] = React.useState<Record<string, number>>({
    "5": 0,
    "4": 0,
    "3": 0,
    "2": 0,
    "1": 0,
  });

  const [eligibleOrderItemId, setEligibleOrderItemId] = React.useState<string | null>(null);
  const [hasUserReviewed, setHasUserReviewed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Filters & Sorting
  const [starFilter, setStarFilter] = React.useState<string>("ALL");
  const [withPhotosOnly, setWithPhotosOnly] = React.useState(false);
  const [sortOption, setSortOption] = React.useState<string>("newest");

  // Modals & Forms
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [replyingReviewId, setReplyingReviewId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [replySubmitting, setReplySubmitting] = React.useState(false);

  // Report Modal
  const [reportingReviewId, setReportingReviewId] = React.useState<string | null>(null);
  const [reportReason, setReportReason] = React.useState("SPAM");
  const [reportDetails, setReportDetails] = React.useState("");
  const [reportSuccess, setReportSuccess] = React.useState("");

  // Photo Lightbox
  const [zoomPhoto, setZoomPhoto] = React.useState<string | null>(null);

  const fetchReviews = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (starFilter !== "ALL") params.append("rating", starFilter);
      if (withPhotosOnly) params.append("withPhotos", "true");
      params.append("sort", sortOption);

      const res = await fetch(`/api/products/${productId}/reviews?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setTotalCount(data.totalCount || 0);
        setAvgRating(data.avgRating || 0);
        setBreakdown(data.breakdown || { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 });
        setEligibleOrderItemId(data.eligibleOrderItemId || null);
        setHasUserReviewed(data.hasUserReviewed || false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [productId, starFilter, withPhotosOnly, sortOption]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleVoteHelpful = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  hasVotedHelpful: data.voted,
                  helpfulCount: data.helpfulCount,
                }
              : r
          )
        );
      } else {
        alert(data.error || "Please sign in to vote.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSellerReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplyingReviewId(null);
        setReplyText("");
        fetchReviews();
      } else {
        alert(data.error || "Failed to post reply");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReviewId) return;
    try {
      const res = await fetch(`/api/reviews/${reportingReviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReportSuccess(data.message || "Report submitted successfully.");
        setTimeout(() => {
          setReportingReviewId(null);
          setReportSuccess("");
          setReportDetails("");
        }, 2000);
      } else {
        alert(data.error || "Report failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="pt-10 border-t border-neutral-200 space-y-8" id="customer-reviews">
      {/* Review Form Modal */}
      {eligibleOrderItemId && (
        <ReviewFormModal
          productId={productId}
          orderItemId={eligibleOrderItemId}
          productTitle={productTitle}
          productImage={productImage}
          sellerStoreName={sellerStoreName}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={() => {
            fetchReviews();
          }}
        />
      )}

      {/* Photo Lightbox */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full h-[70vh]">
            <Image
              src={zoomPhoto}
              alt="Review Photo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingReviewId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-extrabold text-base text-neutral-900">
                Report Inappropriate Review
              </h3>
              <button
                onClick={() => setReportingReviewId(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Reason for Report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900"
                  >
                    <option value="SPAM">Spam or automated content</option>
                    <option value="ABUSIVE_LANGUAGE">Harassment or abusive language</option>
                    <option value="FAKE_REVIEW">Fake review or competitor malice</option>
                    <option value="IRRELEVANT">Irrelevant to the product/seller</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe why this review violates campus marketplace guidelines..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReportingReviewId(null)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                  >
                    Submit Report
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TOP HEADER: Overall Rating & 5-Star Breakdown Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-50/70 border border-neutral-200/80 rounded-3xl p-6 sm:p-8">
        {/* Left Column: Big Average Score */}
        <div className="lg:col-span-4 text-center lg:text-left space-y-2 border-b lg:border-b-0 lg:border-r border-neutral-200/80 pb-6 lg:pb-0 lg:pr-8">
          <div className="flex items-baseline justify-center lg:justify-start gap-2">
            <span className="text-5xl font-black text-neutral-950 tracking-tight">
              {avgRating > 0 ? avgRating : "—"}
            </span>
            <span className="text-sm font-bold text-neutral-400">/ 5.0</span>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(avgRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-neutral-300"
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-neutral-500 font-medium">
            Based on {totalCount} verified campus {totalCount === 1 ? "review" : "reviews"}
          </p>

          <div className="pt-3">
            {eligibleOrderItemId ? (
              <Button
                onClick={() => setReviewModalOpen(true)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Write a Verified Review
              </Button>
            ) : hasUserReviewed ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                You reviewed this purchase
              </span>
            ) : (
              <p className="text-[11px] text-neutral-400">
                Only verified student buyers who have purchased this product can leave a review.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: 5-Star Breakdown Bar Chart */}
        <div className="lg:col-span-8 space-y-2.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = breakdown[String(stars)] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

            return (
              <button
                key={stars}
                onClick={() => setStarFilter(starFilter === String(stars) ? "ALL" : String(stars))}
                className={`w-full flex items-center gap-3 text-xs group text-left transition-opacity ${
                  starFilter !== "ALL" && starFilter !== String(stars)
                    ? "opacity-40"
                    : "opacity-100"
                }`}
              >
                <div className="flex items-center gap-1 w-16 font-bold text-neutral-700 shrink-0">
                  <span>{stars}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>

                <div className="flex-1 h-2.5 bg-neutral-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="w-14 text-right text-neutral-500 font-medium shrink-0">
                  {pct}% ({count})
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER BAR & SORT DROPDOWN */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStarFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              starFilter === "ALL"
                ? "bg-neutral-900 text-white"
                : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"
            }`}
          >
            All Stars
          </button>

          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(String(s))}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 whitespace-nowrap ${
                starFilter === String(s)
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}

          <button
            onClick={() => setWithPhotosOnly(!withPhotosOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              withPhotosOnly
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>With Photos</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 font-medium whitespace-nowrap">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-neutral-200 font-bold text-neutral-900 focus:outline-none focus:border-emerald-500"
          >
            <option value="newest">Newest First</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            Loading student reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-3">
            <MessageCircle className="w-8 h-8 text-neutral-300 mx-auto" />
            <h4 className="font-bold text-sm text-neutral-800">
              No matching reviews yet
            </h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Be the first verified campus buyer to share feedback after completing your order.
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-neutral-200/80 p-6 space-y-4 shadow-xs"
            >
              {/* Review Card Top Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-bold text-sm text-neutral-900 truncate max-w-[140px] sm:max-w-none">
                      {r.displayName}
                    </span>
                    {r.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= r.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Author Actions / Report */}
                <div className="flex items-center gap-2">
                  {r.isAuthor && (
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete your review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setReportingReviewId(r.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    title="Report review"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-neutral-100 text-neutral-700"
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comment text */}
              {r.comment && (
                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-line">
                  {r.comment}
                </p>
              )}

              {/* Photos Gallery */}
              {r.photos.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {r.photos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setZoomPhoto(p)}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={p}
                        alt="Customer photo"
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Card Actions: Helpful Button */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                <button
                  onClick={() => handleVoteHelpful(r.id)}
                  disabled={r.isAuthor}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    r.hasVotedHelpful
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 border border-transparent"
                  } ${r.isAuthor ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({r.helpfulCount})</span>
                </button>

                {/* Seller Reply Trigger */}
                {isSeller && !r.reply && replyingReviewId !== r.id && (
                  <button
                    onClick={() => {
                      setReplyingReviewId(r.id);
                      setReplyText("");
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Reply as Seller</span>
                  </button>
                )}
              </div>

              {/* Seller Reply Form */}
              {replyingReviewId === r.id && (
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      Public Reply from {sellerStoreName}
                    </span>
                    <button
                      onClick={() => setReplyingReviewId(null)}
                      className="text-xs text-neutral-400 hover:text-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Thank the buyer or address their feedback professionally..."
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSellerReply(r.id)}
                      disabled={replySubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                    >
                      {replySubmitting ? "Posting..." : "Post Reply"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Seller Reply Card */}
              {r.reply && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 space-y-1.5 ml-4 sm:ml-8">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Response from {r.reply.storeName}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {formatDate(r.reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-800 leading-relaxed">
                    {r.reply.body}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
