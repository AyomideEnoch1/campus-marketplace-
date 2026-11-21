"use client";

import * as React from "react";
import { ShoppingCart } from "lucide-react";

export interface LoaderProps {
  /**
   * Whether to render as a modal with a blurred backdrop overlay.
   * Default is true.
   */
  isModal?: boolean;
  className?: string;
}

export function Loader({ isModal = true, className = "" }: LoaderProps) {
  const modalCard = (
    <div
      role="status"
      aria-live="polite"
      className={`relative bg-white/95 backdrop-blur-md rounded-3xl px-6 py-5 sm:px-7 sm:py-6 shadow-2xl border border-neutral-200/80 flex flex-col items-center gap-3.5 max-w-[290px] sm:max-w-xs w-auto mx-auto overflow-hidden animate-in zoom-in-95 duration-200 select-none ${className}`}
    >
      {/* Container for Logo + "Loading..." with unified sweeping animation from first end to other end */}
      <div className="relative overflow-hidden rounded-2xl p-1.5 px-2 flex items-center gap-3.5">
        {/* Synchronized Sweeping Light Wave moving from first end to other end across Logo & Text */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full animate-loader-sweep bg-gradient-to-r from-transparent via-white/70 to-transparent z-20" />

        {/* Brand Logo Squircle */}
        <div className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0 animate-pulse">
          <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-xs" />
        </div>

        {/* Brand text turned to Loading... with the exact font, text, style, and vibe */}
        {/* <div className="relative z-10 font-extrabold text-xl sm:text-2xl tracking-tight text-neutral-900 leading-none flex items-baseline">
          <span className="inline-flex text-emerald-500 ml-0.5 font-bold">
            <span
              className="animate-bounce inline-block"
              style={{ animationDelay: "0ms" }}
            >
              .
            </span>
            <span
              className="animate-bounce inline-block"
              style={{ animationDelay: "150ms" }}
            >
              .
            </span>
            <span
              className="animate-bounce inline-block"
              style={{ animationDelay: "300ms" }}
            >
              .
            </span>
          </span>
        </div> */}
      </div>

      {/* Traveling Ambient Progress Line below */}
      <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full animate-loader-track" />
      </div>

      {/* <span className="sr-only">Loading...</span> */}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[9999] bg-neutral-950/35 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in">
        {modalCard}
      </div>
    );
  }

  return modalCard;
}

export default Loader;
