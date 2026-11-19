"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface SmartBackButtonProps {
  fallbackUrl?: string;
  fallbackLabel?: string;
  className?: string;
}

export function SmartBackButton({
  fallbackUrl = "/",
  fallbackLabel = "Back",
  className = "inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition-colors",
}: SmartBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button type="button" onClick={handleBack} className={className}>
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>{fallbackLabel}</span>
    </button>
  );
}
