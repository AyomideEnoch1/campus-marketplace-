"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/Loader";
import { PasswordStrengthGauge } from "@/components/ui/PasswordStrengthGauge";

export const dynamic = "force-dynamic";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!token) {
      setError("Reset token is missing. Please use the link provided in your email.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login?reset=success");
      }, 2500);
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-7 sm:p-9 space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-neutral-900">
            Invalid Password Reset Link
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
            This password reset link is missing a security token or has expired. Please request a new link.
          </p>
        </div>

        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
        >
          <span>Request New Reset Link</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-7 sm:p-9 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/25">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          Create New Password
        </h1>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Please choose a strong password to secure your account.
        </p>
      </div>

      {success ? (
        <div className="space-y-6 text-center animate-in fade-in-50 py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-neutral-900">
              Password Reset Complete!
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-xs mx-auto">
              Your password has been updated successfully. Redirecting you to sign in...
            </p>
          </div>

          <Link
            href="/auth/login?reset=success"
            className="inline-flex items-center justify-center gap-2 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in-50">
              {error}
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                maxLength={64}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="pl-10 pr-10 h-11 rounded-xl text-xs bg-neutral-50/50 border-neutral-200 focus:bg-white text-neutral-900 transition-all"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {password && <PasswordStrengthGauge password={password} />}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                maxLength={64}
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="pl-10 pr-10 h-11 rounded-xl text-xs bg-neutral-50/50 border-neutral-200 focus:bg-white text-neutral-900 transition-all"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full h-11 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Updating password...</span>
              </div>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Back to Login Link */}
      <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100">
        Remembered your credentials?{" "}
        <Link
          href="/auth/login"
          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-neutral-50 to-neutral-100/60">
      <React.Suspense fallback={<Loader isModal={true} />}>
        <ResetPasswordForm />
      </React.Suspense>
    </div>
  );
}
