"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Lock,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  title = "Sign in to Add to Bag",
  description = "You need an active campus account to add items to your shopping bag and proceed to checkout.",
}: AuthRequiredModalProps) {
  const pathname = usePathname();
  const [redirectPath, setRedirectPath] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectPath(`${window.location.pathname}${window.location.search}`);
    } else {
      setRedirectPath(pathname || "/");
    }
  }, [pathname, isOpen]);

  // Handle ESC key to dismiss
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is active
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loginHref = redirectPath
    ? `/auth/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/auth/login";

  const registerHref = redirectPath
    ? `/auth/register?redirect=${encodeURIComponent(redirectPath)}`
    : "/auth/register";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-neutral-100/80 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <div className="text-center space-y-4">
          {/* Animated Graphic Icon */}
          <div className="relative w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-2 ring-white">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h3
              id="auth-modal-title"
              className="text-xl font-black text-neutral-900 tracking-tight"
            >
              {title}
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 text-left space-y-2">
            <div className="flex items-center gap-2.5 text-xs text-neutral-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3" />
              </span>
              <span>Sync bag & saved listings across all devices</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-neutral-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageCircle className="w-3 h-3" />
              </span>
              <span>Direct WhatsApp contact with verified student sellers</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-neutral-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3 h-3" />
              </span>
              <span>Safe on-campus meetups & hostel delivery</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Link href={loginHref} onClick={onClose} className="block">
              <Button
                size="lg"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Sign In to Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>

            <Link href={registerHref} onClick={onClose} className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 border-neutral-200 hover:bg-neutral-100/80 text-neutral-700 font-semibold text-xs rounded-2xl cursor-pointer"
              >
                Create Free Campus Account
              </Button>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors pt-1 cursor-pointer"
            >
              Continue browsing as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
