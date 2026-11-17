"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";

interface SignoutModalProps {
  isOpen: boolean;
  message?: string;
  submessage?: string;
}

export function SignoutModal({
  isOpen,
  message = "Signing Out...",
  submessage = "Please wait while we securely end your session and clear your data.",
}: SignoutModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent keyboard dismiss, scrolling, and block all user interactions on the entire screen
  React.useEffect(() => {
    if (!isOpen) return;

    // Block keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Block clicks, mousedown, and touches from reaching anything underneath
    const blockEvent = (e: Event) => {
      // Allow events inside the modal if needed, but intercept everything else
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-signout-modal-card]")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Use capturing listeners on window so clicks are intercepted before reaching any buttons
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("click", blockEvent, true);
    window.addEventListener("mousedown", blockEvent, true);
    window.addEventListener("pointerdown", blockEvent, true);
    window.addEventListener("touchstart", blockEvent, true);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("click", blockEvent, true);
      window.removeEventListener("mousedown", blockEvent, true);
      window.removeEventListener("pointerdown", blockEvent, true);
      window.removeEventListener("touchstart", blockEvent, true);
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-modal-title"
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[999999] bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none cursor-wait"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        data-signout-modal-card="true"
        className="relative bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-neutral-200/80 flex flex-col items-center gap-4 max-w-sm w-full text-center animate-in zoom-in-95 duration-200 select-none pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Animated Icon */}
        <div className="relative w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/80 shadow-inner">
          <LogOut className="w-8 h-8 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md ring-2 ring-white">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3
            id="signout-modal-title"
            className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight"
          >
            {message}
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
            {submessage}
          </p>
        </div>

        {/* Progress Bar Animation */}
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden relative mt-1">
          <div className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 rounded-full animate-loader-track" />
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SignoutModal;
