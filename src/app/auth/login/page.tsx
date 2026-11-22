"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  GraduationCap,
  ShoppingBag,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/Loader";
import { Input } from "@/components/ui/input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const redirectParam = searchParams.get("redirect");
  const roleParam = searchParams.get("role");
  const errorParam = searchParams.get("error");
  const resetParam = searchParams.get("reset");

  React.useEffect(() => {
    if (errorParam) {
      if (errorParam === "cancelled") {
        setError("Google Sign-In was cancelled.");
      } else if (errorParam === "email_not_verified") {
        setError("Your Google email is not verified. Please verify your email with Google first.");
      } else if (errorParam === "server_config_error") {
        setError("Google Sign-In is not configured yet on the server.");
      } else if (errorParam === "invalid_state") {
        setError("Authentication session expired. Please try again.");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim()) {
      setError("Please enter your email address or phone number.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification && data.redirectTo) {
          window.location.href = data.redirectTo;
          return;
        }
        throw new Error(data.error || "Login failed");
      }

      // Automatically route to intended destination or the deciphered account dashboard
      const targetUrl = redirectParam || data.redirectTo || "/shop";
      window.location.href = targetUrl;
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err?.message || "Failed to sign in. Please check your credentials.");
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
          Welcome to ọjà
        </h1>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Sign in to access your orders, saved listings, or vendor store
        </p>
      </div>

      {/* Auto-detect Notice */}
      <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5 text-emerald-900 text-xs">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="leading-snug text-[11px] text-emerald-800">
          Enter your credentials below. The system automatically detects whether your account is a <strong>Student Buyer</strong> or <strong>Campus Vendor</strong>.
        </p>
      </div>

      {/* Reset success message */}
      {resetParam === "success" && !error && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in-50 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your password has been reset successfully! Please sign in below.</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in-50">
          {error}
        </div>
      )}

      {/* Login Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 block">
            Email Address or Phone Number
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              required
              maxLength={100}
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@unilag.edu.ng or 08012345678"
              className="pl-10 h-11 rounded-xl text-xs bg-neutral-50/50 border-neutral-200 focus:bg-white text-neutral-900 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 block">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type={showPassword ? "text" : "password"}
              required
              maxLength={64}
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
        </div>

        <Button
          type="submit"
          disabled={loading || !email.trim() || !password.trim()}
          className="w-full h-11 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Signing in, please wait...</span>
            </div>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-neutral-200/80 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">
            Or
          </span>
          <div className="border-t border-neutral-200/80 w-full" />
        </div>

        {/* Google Sign-In Action Button */}
        <GoogleSignInButton
          redirect={redirectParam || undefined}
          text="Continue with Google"
        />
      
        {/* Don't have an Account Link */}
        <div className="pt-1 text-center text-xs text-neutral-600">
          Don&apos;t have an account?{" "}
          <Link
            href={
              redirectParam
                ? `/auth/register?redirect=${encodeURIComponent(redirectParam)}`
                : "/auth/register"
            }
            className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Create an Account / Register
          </Link>
        </div>
      </form>

      {/* Terms of Use and Privacy Policy */}
      <div className="pt-3 text-center text-xs text-neutral-500 border-t border-neutral-100 leading-relaxed">
        By signing in, you agree to our{" "}
        <Link
          href="/terms"
          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-neutral-50 to-neutral-100/60">
      <React.Suspense fallback={<Loader isModal={true} />}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
