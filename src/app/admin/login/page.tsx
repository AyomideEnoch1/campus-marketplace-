"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Mail, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("admin@campustrade.ng");
  const [password, setPassword] = React.useState("AdminPassword123!");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

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
        throw new Error(data.error || "Authentication failed");
      }

      if (data.user?.role !== "ADMIN") {
        throw new Error("Access Denied: This account does not possess Super Administrator privileges.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign into Admin CMS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-neutral-950">
      <div className="w-full max-w-md bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl p-8 space-y-6 text-white">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Admin CMS Portal</h1>
          <p className="text-xs text-neutral-400">
            Secure administrative control system for CampusTrade
          </p>
        </div>

        {/* 1-Click Credentials Helper */}
        <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/80 text-xs space-y-1">
          <p className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5" />
            Super Admin Default Credentials
          </p>
          <p className="text-neutral-300">
            Email: <code className="text-white bg-neutral-950 px-1 py-0.5 rounded">admin@campustrade.ng</code>
          </p>
          <p className="text-neutral-300">
            Password: <code className="text-white bg-neutral-950 px-1 py-0.5 rounded">AdminPassword123!</code>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
              <Input
                type="email"
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:border-emerald-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30"
          >
            {loading ? "Authenticating..." : "Enter Admin Dashboard"}
          </Button>
        </form>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
            &larr; Return to Marketplace Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
