"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Store,
  ArrowRight,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-auth-query";
import { Loader } from "@/components/ui/Loader";

export const dynamic = "force-dynamic";

export default function RoleSelectPage() {
  const router = useRouter();
  const { data: authData, isLoading } = useCurrentUser();
  const user = authData?.user;

  if (isLoading) {
    return <Loader isModal={true} />;
  }

  const displayName = user?.fullName?.split(" ")[0] || "there";

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-neutral-50 via-neutral-100/50 to-neutral-50">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-7 sm:p-9 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Google Account Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Welcome to ọjà, {displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
            Your Google account has been verified. Choose how you would like to use CampusTrade:
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-1">
          {/* Option 1: Buyer */}
          <button
            type="button"
            onClick={() => {
              router.push("/shop");
              router.refresh();
            }}
            className="w-full group p-4 sm:p-5 rounded-2xl border-2 border-neutral-200 hover:border-emerald-500 bg-neutral-50/50 hover:bg-emerald-50/20 text-left transition-all duration-200 hover:shadow-md hover:shadow-emerald-600/5 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 group-hover:border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-emerald-950 transition-colors">
                  Continue as Student Buyer
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  Buyer
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
                Browse campus listings, buy textbooks and gadgets, and order with escrow protection.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/* Option 2: Vendor */}
          <button
            type="button"
            onClick={() => {
              router.push("/vendor/register");
              router.refresh();
            }}
            className="w-full group p-4 sm:p-5 rounded-2xl border-2 border-neutral-200 hover:border-purple-500 bg-neutral-50/50 hover:bg-purple-50/20 text-left transition-all duration-200 hover:shadow-md hover:shadow-purple-600/5 flex items-center gap-4 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 group-hover:border-purple-300 text-purple-600 flex items-center justify-center shrink-0 shadow-xs transition-colors">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-purple-950 transition-colors">
                  Open a Campus Store
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                  Vendor
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
                Set up your store name, campus, and WhatsApp to start selling to fellow students.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        </div>

        {/* Security Reassurance */}
        <div className="pt-2 flex items-center justify-center gap-2 text-center text-xs text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>You can switch between Buyer and Seller modes at any time.</span>
        </div>
      </div>
    </div>
  );
}
