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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Route to intended destination or appropriate dashboard
      if (redirectParam) {
        router.push(redirectParam);
      } else {
        router.push(data.redirectTo || "/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role: "buyer" | "vendor") => {
    setSelectedRole(role);
    setError("");
    if (role === "buyer") {
      setEmail("student@campustrade.ng");
      setPassword("StudentPassword123!");
    } else {
      setEmail("kicks@unilag.ng");
      setPassword("VendorPassword123!");
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-7 sm:p-9 space-y-7">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-neutral-900">
            Campus<span className="text-emerald-600">Trade</span>
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          Welcome to the Campus Marketplace
        </h1>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
          Sign in to your account to place orders, chat with vendors, or manage your student storefront.
        </p>
      </div>

      {/* Role Selection / Demo Quick-Switch */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Select Account Type
          </label>
          <span className="text-[11px] text-emerald-600 font-semibold">
            One-click demo fill
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* User / Student Buyer Option */}
          <button
            type="button"
            onClick={() => handleSelectRole("buyer")}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 ${
              selectedRole === "buyer"
                ? "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-neutral-50/80 hover:bg-white border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                selectedRole === "buyer"
                  ? "bg-emerald-600 text-white"
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
                Browse listings, save items & place campus orders
              </p>
            </div>
          </button>

          {/* Vendor / Student Seller Option */}
          <button
            type="button"
            onClick={() => handleSelectRole("vendor")}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 ${
              selectedRole === "vendor"
                ? "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-neutral-50/80 hover:bg-white border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                selectedRole === "vendor"
                  ? "bg-emerald-600 text-white"
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
                Manage storefront, products, orders & WhatsApp
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200/80" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-white px-3 text-neutral-400 font-semibold tracking-wider">
            Or sign in with email
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
          <label className="text-xs font-bold text-neutral-700 block">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSelectedRole(null);
              }}
              placeholder="e.g. student@campustrade.ng"
              className="pl-10 h-11 bg-neutral-50/50 border-neutral-200 focus:bg-white rounded-xl text-xs text-neutral-900"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 block">
              Password
            </label>
            <Link
              href="#"
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 pr-10 h-11 bg-neutral-50/50 border-neutral-200 focus:bg-white rounded-xl text-xs text-neutral-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
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
          disabled={loading}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:shadow-emerald-600/30 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            "Signing in..."
          ) : (
            <>
              <span>Sign In to Account</span>
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
      <React.Suspense
        fallback={
          <div className="text-sm text-neutral-500">Loading sign in form...</div>
        }
      >
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
