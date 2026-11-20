"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Building, ArrowRight, ShieldCheck, Wallet, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CampusItem {
  id: string;
  name: string;
  city: string;
}

export function AmbassadorOnboarding({
  campuses,
  userName,
}: {
  campuses: CampusItem[];
  userName: string;
}) {
  const router = useRouter();
  const [campusId, setCampusId] = React.useState(campuses[0]?.id || "");
  const [preferredCode, setPreferredCode] = React.useState(
    userName.split(" ")[0]?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "CAMPUS"
  );
  const [whatsapp, setWhatsapp] = React.useState("+234 ");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!campusId) {
      toast.error("Please select your university");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/ambassador/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campusId,
          preferredCode: preferredCode.trim().toUpperCase(),
          whatsapp: whatsapp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to activate ambassador hub");

      toast.success(data.message || "Ambassador profile created!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Campus Ambassador Program
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight sm:text-4xl">
            Represent ọjà on Your Campus
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base max-w-lg mx-auto">
            Empower fellow students in your hostel, faculty, and department to buy and sell safely. Earn cash bounties on every student and vendor you onboard.
          </p>
        </div>

        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm text-center">
            <QrCode className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-neutral-900">Custom QR Codes</h3>
            <p className="text-xs text-neutral-500 mt-1">Download flyers to post on status or print for notice boards</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm text-center">
            <Wallet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-neutral-900">₦500 Per Vendor</h3>
            <p className="text-xs text-neutral-500 mt-1">Plus ₦100 per shopper, paid directly into your bank account</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-neutral-900">Safe Campus Escrow</h3>
            <p className="text-xs text-neutral-500 mt-1">Represent a secure system that ends campus scamming forever</p>
          </div>
        </div>

        {/* Activation Form */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-8 shadow-sm">
          <form onSubmit={handleActivate} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1.5">
                Select Your Campus
              </label>
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1.5">
                Preferred Referral Code
              </label>
              <Input
                type="text"
                maxLength={10}
                value={preferredCode}
                onChange={(e) => setPreferredCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="e.g. UNILAG-AYO"
                className="font-mono text-base font-bold tracking-wider h-11"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                This code will be embedded in your referral links and flyer QR codes.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-1.5">
                WhatsApp Phone Number
              </label>
              <Input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+234 801 234 5678"
                className="h-11 text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !campusId || !preferredCode}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? "Activating Hub..." : "Launch My Ambassador Hub"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
