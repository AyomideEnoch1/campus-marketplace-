"use client";

import * as React from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface PasswordStrengthGaugeProps {
  password: string;
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  colorClass: string;
  barColorClass: string;
} {
  if (!password) {
    return {
      score: 0,
      label: "",
      colorClass: "text-neutral-400",
      barColorClass: "bg-neutral-200",
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length < 6 && score > 1) {
    score = 1;
  }

  switch (score) {
    case 1:
      return {
        score: 1,
        label: "Weak",
        colorClass: "text-rose-600",
        barColorClass: "bg-rose-500",
      };
    case 2:
      return {
        score: 2,
        label: "Fair",
        colorClass: "text-amber-600",
        barColorClass: "bg-amber-500",
      };
    case 3:
      return {
        score: 3,
        label: "Good",
        colorClass: "text-blue-600",
        barColorClass: "bg-blue-500",
      };
    case 4:
      return {
        score: 4,
        label: "Strong",
        colorClass: "text-emerald-600",
        barColorClass: "bg-emerald-500",
      };
    default:
      return {
        score: 0,
        label: "",
        colorClass: "text-neutral-400",
        barColorClass: "bg-neutral-200",
      };
  }
}

export function PasswordStrengthGauge({ password }: PasswordStrengthGaugeProps) {
  if (!password) return null;

  const { score, label, colorClass, barColorClass } = getPasswordStrength(password);

  return (
    <div className="space-y-1.5 pt-1 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-neutral-500 font-medium flex items-center gap-1">
          {score <= 1 ? (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          ) : score >= 4 ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-amber-500" />
          )}
          Password Strength:
        </span>
        <span className={`font-bold ${colorClass}`}>{label}</span>
      </div>

      {/* 4-segment progress bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-all duration-300 ${
              step <= score ? barColorClass : "bg-neutral-100"
            }`}
          />
        ))}
      </div>

      <p className="text-[10px] text-neutral-400 leading-tight">
        {score < 3
          ? "Combine at least 8 characters with letters, numbers & symbols."
          : "Great job! Your password meets security standards."}
      </p>
    </div>
  );
}
