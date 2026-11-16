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
  duration?: number;
}

export function CartSnackbar({
  data,
  onDismiss,
  duration = 3000,
}: CartSnackbarProps) {
  const [activeData, setActiveData] = React.useState<SnackbarData | null>(data);
  const [isExiting, setIsExiting] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(true);

    // Wait for the slide-out animation to complete before clearing state
    exitTimerRef.current = setTimeout(() => {
      setActiveData(null);
      setIsExiting(false);
      onDismiss();
    }, 300);
  }, [onDismiss]);

  // When new data arrives, display it, cancel any pending timers, and start 3-second timer
  React.useEffect(() => {
    if (data) {
      setActiveData(data);
      setIsExiting(false);

      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }
  }, [data, duration, handleDismiss]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  if (!activeData) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[9999] w-[92%] sm:w-auto max-w-md pointer-events-auto ${
        isExiting ? "animate-snackbar-out" : "animate-snackbar-in"
      }`}
    >
      <div className="bg-neutral-950/95 backdrop-blur-xl text-white rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.3)] border border-white/15 flex items-center justify-between gap-3.5 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Thumbnail or Fallback Icon */}
          {activeData.image ? (
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-neutral-800 border border-white/10 shrink-0">
              <img
                src={activeData.image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeData.type === "added"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {activeData.type === "added" ? (
                <ShoppingBag className="w-4 h-4" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </div>
          )}

          {/* Item Meta & Status */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
              {activeData.title}
            </p>
            <p
              className={`text-[11px] font-medium flex items-center gap-1 ${
                activeData.type === "added" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {activeData.type === "added" ? (
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
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
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
