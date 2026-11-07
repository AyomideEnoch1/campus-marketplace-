"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowRight, ShieldAlert, KeyRound, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

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

      // Route to intended destination
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

  // Helper quick-fill demo buttons for fast evaluation
  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-100 shadow-xl p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-neutral-900">
            Campus<span className="text-emerald-600">Trade</span>
          </span>
        </Link>
        <h1 className="text-2xl font-extrabold text-neutral-900">Welcome Back</h1>
        <p className="text-xs text-neutral-500">
          Sign in to your account, manage your store, or check your orders
        </p>
      </div>

      {/* Demo Fast-Fill Pills for Easy Testing */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
        <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
          <KeyRound className="w-3 h-3 text-emerald-600" />
          Quick Demo Accounts (1-Click Fill)
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => fillCredentials("admin@campustrade.ng", "AdminPassword123!")}
            className="p-2 rounded-xl bg-white border border-emerald-200 text-left hover:bg-emerald-100/50 transition-colors"
          >
            <span className="font-bold block text-neutral-800">👑 Super Admin</span>
            <span className="text-[10px] text-neutral-500">Full CMS control</span>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials("kicks@unilag.ng", "VendorPassword123!")}
            className="p-2 rounded-xl bg-white border border-emerald-200 text-left hover:bg-emerald-100/50 transition-colors"
          >
            <span className="font-bold block text-neutral-800">👟 Vendor (UNILAG)</span>
            <span className="text-[10px] text-neutral-500">Kicks & Apparel</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@campustrade.ng"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700">Password</label>
            <Link href="#" className="text-xs text-emerald-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/20"
        >
          {loading ? "Signing in..." : "Sign In to CampusTrade"}
        </Button>
      </form>

      {/* Register Prompt */}
      <div className="pt-2 text-center text-xs text-neutral-500">
        Don&apos;t have an account yet?{" "}
        <Link href="/auth/register" className="font-bold text-emerald-600 hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-neutral-50/70">
      <React.Suspense fallback={<div className="text-sm text-neutral-500">Loading sign in form...</div>}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
