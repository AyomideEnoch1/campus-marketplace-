"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Store,
  ShoppingBag,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/Loader";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

type RoleOption = "buyer" | "vendor" | null;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<RoleOption>(null);

  const redirectParam = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!selectedRole) {
      setError("Please select whether you are signing in as a Student Buyer or Campus Vendor.");
      return;
    }

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
          role: selectedRole.toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Route to intended destination or appropriate dashboard
      const targetUrl = redirectParam || data.redirectTo || (selectedRole === "vendor" ? "/dashboard" : "/shop");
      window.location.href = targetUrl;
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err?.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  const handleSelectRole = (role: "buyer" | "vendor") => {
    setSelectedRole(role);
    setError("");
  };

  const isFormDisabled = !selectedRole || loading;

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-7 sm:p-9 space-y-7">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          Welcome to CampusTrade
        </h1>
        <p className="text-xs text-neutral-500">
          Sign in to access your orders, saved listings, or vendor store
        </p>
      </div>

      {/* Role Selection / Account Type Tabs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Select Account Type <span className="text-rose-500">*</span>
          </label>
          {!selectedRole && (
            <span className="text-[11px] text-amber-600 font-semibold animate-pulse">
              Select one to unlock fields
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* User / Student Buyer Option */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSelectRole("buyer")}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 ${
              loading
                ? "cursor-not-allowed opacity-70 pointer-events-none"
                : "cursor-pointer"
            } ${
              selectedRole === "buyer"
                ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-neutral-50/80 hover:bg-white border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                selectedRole === "buyer"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-neutral-700 border border-neutral-200 group-hover:text-emerald-600"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">
                  Student Buyer
                </span>
                {selectedRole === "buyer" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 leading-snug">
                Browse listings, save items &amp; place campus orders
              </p>
            </div>
          </button>

          {/* Vendor / Campus Vendor Option */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSelectRole("vendor")}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 ${
              loading
                ? "cursor-not-allowed opacity-70 pointer-events-none"
                : "cursor-pointer"
            } ${
              selectedRole === "vendor"
                ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-neutral-50/80 hover:bg-white border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                selectedRole === "vendor"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-neutral-700 border border-neutral-200 group-hover:text-emerald-600"
              }`}
            >
              <Store className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">
                  Campus Vendor
                </span>
                {selectedRole === "vendor" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 leading-snug">
                Manage storefront, products, orders &amp; WhatsApp
              </p>
            </div>
          </button>
        </div>

        {/* Informational banner when tab is not selected */}
        {!selectedRole && (
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 animate-in fade-in-50">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Please select <strong>Student Buyer</strong> or <strong>Campus Vendor</strong> above to enable sign-in.</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200/80" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-white px-3 text-neutral-400 font-semibold tracking-wider">
            Sign in with email / phone
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in-50">
          {error}
        </div>
      )}

      {/* Login Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            className={`text-xs font-bold block transition-colors ${
              !selectedRole ? "text-neutral-400" : "text-neutral-700"
            }`}
          >
            Email Address or Phone Number *
          </label>
          <div className="relative">
            <Mail
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                !selectedRole ? "text-neutral-300" : "text-neutral-400"
              }`}
            />
            <Input
              type="text"
              required
              maxLength={100}
              disabled={isFormDisabled}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                !selectedRole
                  ? "Select account type above first"
                  : selectedRole === "buyer"
                  ? "e.g. student@unilag.edu.ng or +234 814 817 6165"
                  : "e.g. store@unilag.edu.ng or +234 814 817 6165"
              }
              className={`pl-10 h-11 rounded-xl text-xs transition-all ${
                !selectedRole
                  ? "bg-neutral-100/90 text-neutral-400 border-neutral-200 cursor-not-allowed select-none placeholder:text-neutral-400/70"
                  : "bg-neutral-50/50 border-neutral-200 focus:bg-white text-neutral-900"
              }`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              className={`text-xs font-bold block transition-colors ${
                !selectedRole ? "text-neutral-400" : "text-neutral-700"
              }`}
            >
              Password *
            </label>
            <Link
              href="#"
              className={`text-[11px] font-semibold transition-colors ${
                !selectedRole
                  ? "text-neutral-300 pointer-events-none"
                  : "text-emerald-600 hover:text-emerald-700"
              }`}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                !selectedRole ? "text-neutral-300" : "text-neutral-400"
              }`}
            />
            <Input
              type={showPassword ? "text" : "password"}
              required
              maxLength={64}
              disabled={isFormDisabled}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`pl-10 pr-10 h-11 rounded-xl text-xs transition-all ${
                !selectedRole
                  ? "bg-neutral-100/90 text-neutral-400 border-neutral-200 cursor-not-allowed select-none"
                  : "bg-neutral-50/50 border-neutral-200 focus:bg-white text-neutral-900"
              }`}
            />
            <button
              type="button"
              disabled={isFormDisabled}
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                !selectedRole
                  ? "text-neutral-300 cursor-not-allowed"
                  : "text-neutral-400 hover:text-neutral-600 cursor-pointer"
              }`}
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
          disabled={isFormDisabled || loading || !email.trim() || !password.trim()}
          className={`w-full h-11 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 mt-2 ${
            !selectedRole || !email.trim() || !password.trim()
              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none border border-neutral-200"
              : loading
              ? "bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed pointer-events-none shadow-none opacity-80"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 cursor-pointer"
          }`}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-neutral-500">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
              <span>Signing in, please wait...</span>
            </div>
          ) : (
            <>
              <span>
                {!selectedRole
                  ? "Select Account Type to Sign In"
                  : selectedRole === "vendor"
                  ? "Sign In to Vendor Dashboard"
                  : "Sign In as Student Buyer"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Registration Link */}
      <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span>Don&apos;t have an account yet?</span>
        <div className="flex items-center gap-2">
          <Link
            href="/auth/register"
            className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Create student buyer account
          </Link>
          <span className="text-neutral-300">•</span>
          <Link
            href="/vendor/register"
            className="font-bold text-neutral-700 hover:text-emerald-600 hover:underline"
          >
            Become a seller
          </Link>
        </div>
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
