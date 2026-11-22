"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShoppingCart,
  Loader2,
  Mail,
  KeyRound,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/Loader";

export const dynamic = "force-dynamic";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const statusParam = searchParams.get("status");

  const [loading, setLoading] = React.useState(Boolean(token && !statusParam));
  const [submittingCode, setSubmittingCode] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [resendNotice, setResendNotice] = React.useState("");

  const [email, setEmail] = React.useState(emailParam || "");
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState<"success" | "expired" | "invalid" | null>(
    (statusParam as any) || (token ? null : null)
  );
  const [errorMessage, setErrorMessage] = React.useState("");
  const [destinationUrl, setDestinationUrl] = React.useState("/shop");

  // Cooldown timer effect
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-verify token if present in query parameters
  React.useEffect(() => {
    if (token && !statusParam) {
      setLoading(true);
      fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok && data.success) {
            setStatus("success");
            if (data.redirectTo) setDestinationUrl(data.redirectTo);
          } else {
            setStatus("invalid");
            setErrorMessage(data.error || "Failed to verify email link.");
          }
        })
        .catch((err) => {
          console.error("Verification error:", err);
          setStatus("invalid");
          setErrorMessage("Network error during verification.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token, statusParam]);

  // Handle manual 6-digit code submission
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingCode) return;

    const cleanCode = code.trim().replace(/\s+/g, "");
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please provide your email address.");
      return;
    }

    setSubmittingCode(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Verification failed. Please check the code.");
      }

      setStatus("success");
      if (data.redirectTo) setDestinationUrl(data.redirectTo);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify code.");
    } finally {
      setSubmittingCode(false);
    }
  };

  // Handle resend verification code / link
  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    if (!email.trim()) {
      setErrorMessage("Please enter your email address to receive a new code.");
      return;
    }

    setResending(true);
    setErrorMessage("");
    setResendNotice("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend verification email.");
      }

      if (data.alreadyVerified) {
        setStatus("success");
        return;
      }

      setResendNotice("A new 6-digit verification code has been dispatched to your email address!");
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      setErrorMessage(err.message || "Could not resend email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-8 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
        <h2 className="text-base font-bold text-neutral-900">Verifying your email address...</h2>
        <p className="text-xs text-neutral-500">Please wait while we confirm your account security credentials.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-7 sm:p-9 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/25">
          <ShoppingCart className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          ọjà. Account Verification
        </h1>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Verify your student account to start trading safely on campus
        </p>
      </div>

      {/* Success State */}
      {status === "success" ? (
        <div className="space-y-6 text-center animate-in fade-in-50 py-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-neutral-900">Email Verified Successfully! 🎉</h2>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-xs mx-auto">
              Your email address has been verified. A welcome message has also been sent to your inbox.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button
              type="button"
              onClick={() => {
                window.location.href = destinationUrl;
              }}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Code Input & Verification Form */
        <div className="space-y-5">
          {/* Notification / Info banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-950 text-xs">Verification code sent!</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                We sent a 6-digit confirmation code and link to{" "}
                <span className="font-bold text-neutral-900">{email || "your email address"}</span>.
              </p>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Resend Notice */}
          {resendNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resendNotice}</span>
            </div>
          )}

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            {/* Email Address Field (if not already set) */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>Account Email</span>
              </label>
              <Input
                type="email"
                placeholder="student@university.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 text-xs rounded-xl bg-neutral-50/70 border-neutral-200"
              />
            </div>

            {/* 6-Digit Code Field */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-neutral-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
                  <span>6-Digit Verification Code</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">Check Spam if not found</span>
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-center text-xl font-bold tracking-[6px] rounded-xl bg-neutral-50 border-neutral-300 font-mono text-emerald-700 focus:bg-white"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submittingCode || code.length !== 6}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submittingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Resend Action */}
          <div className="pt-2 text-center space-y-2">
            <p className="text-xs text-neutral-500">Didn&apos;t receive the code or link?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:text-neutral-400 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : resending
                  ? "Sending fresh code..."
                  : "Resend verification code"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100 flex items-center justify-between">
        <Link href="/auth/login" className="hover:text-neutral-900 font-semibold transition-colors">
          &larr; Back to Sign In
        </Link>
        <Link href="/shop" className="hover:text-neutral-900 font-semibold transition-colors">
          Explore as Guest
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-neutral-50 to-neutral-100/60">
      <React.Suspense fallback={<Loader isModal={true} />}>
        <VerifyEmailContent />
      </React.Suspense>
    </div>
  );
}
