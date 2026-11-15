"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, Trash2, ArrowRight, X, Check } from "lucide-react";

export interface SnackbarData {
  id: string;
  type: "added" | "removed";
  title: string;
  image?: string;
  price?: number;
}

interface CartSnackbarProps {
  data: SnackbarData | null;
  onDismiss: () => void;
}

export function CartSnackbar({ data, onDismiss }: CartSnackbarProps) {
  if (!data) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] sm:w-auto max-w-md pointer-events-auto"
    >
      <div className="bg-neutral-950/95 backdrop-blur-xl text-white rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.42),0_4px_16px_rgba(0,0,0,0.28)] border border-white/15 flex items-center justify-between gap-3.5 animate-in slide-in-from-bottom-5 fade-in duration-200">
        <div className="flex items-center gap-3 min-w-0">
          {/* Thumbnail or Fallback Icon */}
          {data.image ? (
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 border border-white/10 shrink-0">
              <img
                src={data.image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                data.type === "added"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {data.type === "added" ? (
                <ShoppingBag className="w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </div>
          )}

          {/* Item Meta & Status */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
              {data.title}
            </p>
            <p
              className={`text-[11px] font-medium flex items-center gap-1 ${
                data.type === "added" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {data.type === "added" ? (
                <>
                  <Check className="w-3 h-3" /> Added to shopping bag
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3" /> Removed from bag
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action: View Cart & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/cart"
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartSnackbar;
