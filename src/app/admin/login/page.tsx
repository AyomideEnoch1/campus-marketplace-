"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ShieldCheck, Lock, Mail, KeyRound, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);

  // Cooldown countdown timer for OTP resend
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Step 1: Submit email & password
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          portal: "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // If email verification OTP is dispatched
      if (data?.requiresVerification) {
        setStep("otp");
        setCooldown(30);
        setSuccessMessage("A 6-digit security verification code has been dispatched to your email.");
        return;
      }

      // If already verified or authenticated
      if (data.user?.role !== "ADMIN" && data.user?.role !== "SUPERADMIN") {
        throw new Error("Access Denied: This account does not possess Administrator privileges.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign into Admin CMS");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit 6-digit OTP code
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\s+/g, "");
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid or expired verification code.");
      }

      // Successful verification -> navigate straight to Admin Dashboard
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resending || cooldown > 0 || !email.trim()) return;
    setResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend code.");
      }

      setCooldown(45);
      setSuccessMessage("A fresh 6-digit verification code has been dispatched to your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-neutral-950">
      <div className="w-full max-w-md bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl p-8 space-y-6 text-white">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-md">
            {step === "credentials" ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {step === "credentials" ? "Admin CMS Portal" : "Admin Security Verification"}
          </h1>
          <p className="text-xs text-neutral-400">
            {step === "credentials"
              ? "Secure administrative control system for ọjà"
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Success message banner */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs animate-in fade-in-50 leading-relaxed">
            {successMessage}
          </div>
        )}

        {/* Error message banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs animate-in fade-in-50 leading-relaxed">
            {error}
          </div>
        )}

        {/* STEP 1: CREDENTIALS FORM */}
        {step === "credentials" && (
          <>
            <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 text-xs space-y-1">
              <p className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5" />
                Super Administrator Access
              </p>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                Enter your authorized administrator credentials below. For security, a 6-digit OTP code will be sent to your email to complete authentication.
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  <Input
                    type="email"
                    required
                    placeholder="e.g. ayomidenoch15@gmail.com"
                    maxLength={100}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Master Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                  <Input
                    type="password"
                    required
                    maxLength={64}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:border-emerald-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {loading ? "Authenticating..." : "Continue to Verification"}
              </Button>
            </form>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION FORM */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">6-Digit Security Code</label>
              <Input
                type="text"
                required
                autoFocus
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                className="text-center font-mono text-2xl tracking-[0.5em] bg-neutral-950 border-neutral-800 text-emerald-400 placeholder:text-neutral-700 focus-visible:border-emerald-500 h-14"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || otp.trim().length !== 6}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{loading ? "Verifying Security Code..." : "Enter Admin Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setSuccessMessage("");
                }}
                className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to login</span>
              </button>

              <button
                type="button"
                disabled={resending || cooldown > 0}
                onClick={handleResendOtp}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</span>
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
            &larr; Return to Marketplace Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
