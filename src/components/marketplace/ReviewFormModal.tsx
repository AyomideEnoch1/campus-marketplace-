"use client";

import * as React from "react";
import {
  Star,
  X,
  Upload,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Clock,
  Smile,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewFormModalProps {
  productId: string;
  orderItemId: string;
  productTitle: string;
  productImage?: string;
  sellerStoreName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_TAGS = [
  "As described",
  "Good quality",
  "Well packaged",
  "Good value",
  "Not as described",
  "Poor quality",
];

export function ReviewFormModal({
  productId,
  orderItemId,
  productTitle,
  productImage,
  sellerStoreName,
  isOpen,
  onClose,
  onSuccess,
}: ReviewFormModalProps) {
  const [rating, setRating] = React.useState<number>(5);
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = React.useState("");
  const [photos, setPhotos] = React.useState<string[]>([]);

  // Separate Seller Rating
  const [rateSeller, setRateSeller] = React.useState(false);
  const [communication, setCommunication] = React.useState(5);
  const [punctuality, setPunctuality] = React.useState(5);
  const [behavior, setBehavior] = React.useState(5);

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [disputePrompt, setDisputePrompt] = React.useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddPhoto = () => {
    if (!photoUrl.trim()) return;
    if (photos.length >= 3) {
      alert("Maximum 3 photos permitted per review.");
      return;
    }
    setPhotos([...photos, photoUrl.trim()]);
    setPhotoUrl("");
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId,
          rating,
          comment,
          tags: selectedTags,
          photoPaths: photos,
          sellerRating: rateSeller
            ? { communication, punctuality, behavior }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      if (data.suggestDispute) {
        setDisputePrompt(true);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 my-8 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Campus Purchase Review
            </div>
            <h2 className="text-lg sm:text-xl font-black text-neutral-900 mt-0.5">
              Review: {productTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {disputePrompt ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Did you encounter an issue with your order?</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              We noticed your rating or tags indicate the item was not as described or poor quality. Your review has been saved, but would you like to file a formal dispute with support or chat with <strong>{sellerStoreName}</strong>?
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                Finished & Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Product Rating */}
            <div className="space-y-1.5 text-center sm:text-left">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                Product Rating <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`${star} Stars`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-neutral-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-black text-sm text-neutral-800">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            {/* 2. Quick Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 block">
                Quick Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  const isNegative = tag.includes("Not") || tag.includes("Poor");
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
                        selected
                          ? isNegative
                            ? "bg-rose-50 border-rose-400 text-rose-700"
                            : "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Written Review */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700">
                  Written Feedback (Optional)
                </label>
                <span className="text-[11px] text-neutral-400">
                  {comment.length}/1,000 chars
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={1000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the item condition, fit, texture, or campus delivery..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* 4. Photos (up to 3) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 block">
                Photos (Optional, max 3)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-emerald-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPhoto}
                  className="text-xs font-bold rounded-xl"
                  disabled={photos.length >= 3}
                >
                  <Upload className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>

              {photos.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 group"
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Separate Seller Rating Card (Optional) */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Rate Seller: {sellerStoreName}
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Separate rating for seller behavior (does not affect product rating).
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="rateSellerCheckbox"
                  checked={rateSeller}
                  onChange={(e) => setRateSeller(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {rateSeller && (
                <div className="space-y-2.5 pt-2 border-t border-neutral-200 text-xs">
                  {/* Communication */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-neutral-700 font-medium">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Communication & Responsiveness
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCommunication(s)}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= communication
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Punctuality */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-neutral-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Punctuality & Delivery Time
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPunctuality(s)}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= punctuality
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Behavior */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-neutral-700 font-medium">
                      <Smile className="w-3.5 h-3.5 text-purple-600" />
                      Courteous Behavior & Professionalism
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBehavior(s)}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= behavior
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-5"
              >
                {submitting ? "Posting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
