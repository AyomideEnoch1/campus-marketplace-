"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  GraduationCap,
  ShoppingBag,
  Store,
  Building,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export type IntentType = "buy" | "sell";
export type AffiliationType = "student" | "guest";

export interface RoleConfig {
  key: string;
  intent: IntentType;
  affiliation: AffiliationType;
  role: "BUYER" | "VENDOR";
  buyerType?: "student" | "guest";
  sellerType?: "student" | "guest";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ROLE_LOOKUP: Record<`${IntentType}_${AffiliationType}`, RoleConfig> = {
  buy_student: {
    key: "buy_student",
    intent: "buy",
    affiliation: "student",
    role: "BUYER",
    buyerType: "student",
    title: "Student Buyer",
    description: "Shop campus listings with verified-student perks.",
    icon: GraduationCap,
  },
  buy_guest: {
    key: "buy_guest",
    intent: "buy",
    affiliation: "guest",
    role: "BUYER",
    buyerType: "guest",
    title: "Guest Buyer",
    description: "Browse and buy without a student account.",
    icon: ShoppingBag,
  },
  sell_student: {
    key: "sell_student",
    intent: "sell",
    affiliation: "student",
    role: "VENDOR",
    sellerType: "student",
    title: "Student Vendor",
    description: "Open a verified campus store.",
    icon: Store,
  },
  sell_guest: {
    key: "sell_guest",
    intent: "sell",
    affiliation: "guest",
    role: "VENDOR",
    sellerType: "guest",
    title: "Non-Student Vendor",
    description: "Sell on ọjà as a local merchant or off-campus business.",
    icon: Building,
  },
};

export interface JoinOnboardingScreenProps {
  initialIntent?: IntentType;
  initialAffiliation?: AffiliationType;
  referralCode?: string;
  onClearReferral?: () => void;
  error?: string;
  onContinue: (config: RoleConfig) => void;
  onRoleChange?: (config: RoleConfig) => void;
  onExploreGuest?: () => void;
  signInHref?: string;
  className?: string;
}

export function JoinOnboardingScreen({
  initialIntent = "buy",
  initialAffiliation = "student",
  referralCode,
  onClearReferral,
  error,
  onContinue,
  onRoleChange,
  onExploreGuest,
  signInHref = "/auth/login",
  className = "",
}: JoinOnboardingScreenProps) {
  const [intent, setIntent] = React.useState<IntentType>(initialIntent);
  const [affiliation, setAffiliation] = React.useState<AffiliationType>(initialAffiliation);

  // Sync state if initial props change
  React.useEffect(() => {
    setIntent(initialIntent);
  }, [initialIntent]);

  React.useEffect(() => {
    setAffiliation(initialAffiliation);
  }, [initialAffiliation]);

  const currentKey = `${intent}_${affiliation}` as const;
  const currentRole = ROLE_LOOKUP[currentKey];
  const IconComponent = currentRole.icon;

  const handleIntentChange = (newIntent: IntentType) => {
    setIntent(newIntent);
    if (onRoleChange) {
      const nextKey = `${newIntent}_${affiliation}` as const;
      onRoleChange(ROLE_LOOKUP[nextKey]);
    }
  };

  const handleAffiliationChange = (newAffiliation: AffiliationType) => {
    setAffiliation(newAffiliation);
    if (onRoleChange) {
      const nextKey = `${intent}_${newAffiliation}` as const;
      onRoleChange(ROLE_LOOKUP[nextKey]);
    }
  };

  const handleContinue = () => {
    onContinue(currentRole);
  };

  return (
    <div
      className={`w-full max-w-[420px] mx-auto bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xl shadow-neutral-900/5 flex flex-col justify-between ${className}`}
    >
      {/* 1. Header with centered small green cart icon in a soft rounded square */}
      <div className="text-center">
        <div
          className="w-11 h-11 rounded-2xl bg-[#0F9D76]/10 flex items-center justify-center mx-auto text-[#0F9D76]"
          aria-hidden="true"
        >
          <ShoppingCart className="w-5 h-5 text-[#0F9D76]" strokeWidth={2.2} />
        </div>

        {/* 2. Heading and one-line subtext */}
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight mt-3">
          Join ọjà
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1 leading-normal">
          Tell us how you&apos;ll use ọjà.
        </p>
      </div>

      {/* Referral / Ambassador Banner */}
      {referralCode && (
        <div className="mt-3.5 flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/90 border border-neutral-200 text-neutral-800 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#0F9D76] shrink-0" />
            <span className="truncate text-[11px]">
              Referred by Ambassador:{" "}
              <strong className="font-mono font-bold text-neutral-900 bg-neutral-200/80 px-1.5 py-0.5 rounded">
                {referralCode}
              </strong>
            </span>
          </div>
          {onClearReferral && (
            <button
              type="button"
              onClick={onClearReferral}
              className="text-neutral-400 hover:text-neutral-600 text-[10px] underline shrink-0 ml-2"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mt-3.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in-50">
          {error}
        </div>
      )}

      {/* Toggles Container */}
      <div className="space-y-3 mt-5">
        {/* 3. Segmented toggle #1: [ Buy | Sell ], full width, "Buy" default */}
        <div
          role="radiogroup"
          aria-label="Account intent"
          className="w-full bg-neutral-100 p-1 rounded-2xl flex items-center gap-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={intent === "buy"}
            onClick={() => handleIntentChange("buy")}
            className={`flex-1 h-11 rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D76] focus-visible:ring-offset-2 cursor-pointer ${
              intent === "buy"
                ? "bg-[#0F9D76] text-white font-bold shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 font-medium bg-transparent"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={intent === "sell"}
            onClick={() => handleIntentChange("sell")}
            className={`flex-1 h-11 rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D76] focus-visible:ring-offset-2 cursor-pointer ${
              intent === "sell"
                ? "bg-[#0F9D76] text-white font-bold shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 font-medium bg-transparent"
            }`}
          >
            Sell
          </button>
        </div>

        {/* 4. Segmented toggle #2: [ Student | Guest ], full width, "Student" default */}
        <div
          role="radiogroup"
          aria-label="Account affiliation"
          className="w-full bg-neutral-100 p-1 rounded-2xl flex items-center gap-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={affiliation === "student"}
            onClick={() => handleAffiliationChange("student")}
            className={`flex-1 h-11 rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D76] focus-visible:ring-offset-2 cursor-pointer ${
              affiliation === "student"
                ? "bg-[#0F9D76] text-white font-bold shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 font-medium bg-transparent"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={affiliation === "guest"}
            onClick={() => handleAffiliationChange("guest")}
            className={`flex-1 h-11 rounded-xl text-xs sm:text-sm transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D76] focus-visible:ring-offset-2 cursor-pointer ${
              affiliation === "guest"
                ? "bg-[#0F9D76] text-white font-bold shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 font-medium bg-transparent"
            }`}
          >
            {intent === "sell" ? "Non-Student" : "Guest"}
          </button>
        </div>
      </div>

      {/* 5. Summary Card (updates instantly, animated with subtle fade/slide, single thin 1px border) */}
      <div className="mt-4 px-3.5 py-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 min-h-[64px] flex items-center">
        <div
          key={currentRole.key}
          className="w-full flex items-center gap-3 animate-in fade-in-50 slide-in-from-bottom-1 duration-200"
        >
          <div
            className="w-9 h-9 rounded-xl bg-white border border-neutral-200/70 flex items-center justify-center shrink-0 text-[#0F9D76] shadow-2xs"
            aria-hidden="true"
          >
            <IconComponent className="w-4.5 h-4.5 text-[#0F9D76]" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-neutral-900 leading-tight">
              {currentRole.title}
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-500 leading-snug mt-0.5 whitespace-nowrap">
              {currentRole.description}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Primary Continue button (green #0F9D76, 52px tall, rounded-2xl) */}
      <div className="mt-5">
        <button
          type="button"
          onClick={handleContinue}
          aria-label={`Continue as ${currentRole.title}`}
          className="w-full h-[52px] bg-[#0F9D76] hover:bg-[#0c8262] active:bg-[#0a6d52] text-white font-bold text-sm rounded-2xl transition-colors duration-150 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D76] focus-visible:ring-offset-2 cursor-pointer shadow-sm"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 7. Quiet text link below: "Just looking around? Explore as guest" */}
      <div className="text-center mt-2.5">
        {onExploreGuest ? (
          <button
            type="button"
            onClick={onExploreGuest}
            className="min-h-[44px] text-xs text-neutral-500 hover:text-[#0F9D76] transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D76] rounded cursor-pointer"
          >
            Just looking around? Explore as guest
          </button>
        ) : (
          <Link
            href="/shop"
            className="min-h-[44px] text-xs text-neutral-500 hover:text-[#0F9D76] transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D76] rounded"
          >
            Just looking around? Explore as guest
          </Link>
        )}
      </div>

      {/* 8. Single divider + single "Already have an account? Sign in" with "Sign in" in bold green */}
      <div className="border-t border-neutral-100 my-2" />

      <p className="text-xs text-neutral-500 text-center py-1">
        Already have an account?{" "}
        <Link
          href={signInHref}
          className="font-bold text-[#0F9D76] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F9D76] rounded-xs"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
