"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/Loader";

export const dynamic = "force-dynamic";

function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Forgot password request error:", err);
      setError(err?.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-7 sm:p-9 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/25">
          <ShoppingCart className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          Forgot Password?
        </h1>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Don&apos;t worry! Enter your registered email address and we&apos;ll send you a password reset link.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-6 text-center animate-in fade-in-50">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-neutral-900">
              Check your inbox
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-xs mx-auto">
              We&apos;ve sent a password reset link to{" "}
              <strong className="text-neutral-900">{email}</strong>. Please check your inbox and spam folder.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-[11px] text-neutral-500 leading-relaxed">
            The link is valid for <strong>60 minutes</strong>. Didn&apos;t receive an email? Check your spam folder or try again.
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubmitted(false)}
              className="w-full h-11 text-xs font-bold rounded-xl border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              Try another email address
            </Button>

            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 py-2 w-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in-50">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                type="email"
                required
                maxLength={100}
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@unilag.edu.ng"
                className="pl-10 h-11 rounded-xl text-xs bg-neutral-50/50 border-neutral-200 focus:bg-white text-neutral-900 transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full h-11 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Sending reset link...</span>
              </div>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}

      {/* Footer support */}
      <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100">
        Need assistance?{" "}
        <Link
          href="/contact"
          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-neutral-50 to-neutral-100/60">
      <React.Suspense fallback={<Loader isModal={true} />}>
        <ForgotPasswordForm />
      </React.Suspense>
    </div>
  );
}
