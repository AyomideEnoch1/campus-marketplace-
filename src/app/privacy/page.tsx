import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Privacy Policy | CampusTrade",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50/60 py-12 px-4">
      <div className="container mx-auto max-w-3xl bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 sm:p-10 space-y-6 text-neutral-800">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200/80 text-xs font-semibold uppercase tracking-wider mb-2.5 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Privacy Policy
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Last updated: November 2026</p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-bold text-base text-neutral-900">Information We Collect</h2>
            <p>
              We collect your name, campus affiliation, email address, phone/WhatsApp number, and store information to facilitate smooth communications between student buyers and student vendors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-neutral-900">Data Security</h2>
            <p>
              Your passwords are cryptographically hashed using industry-standard bcrypt. We never sell student data or share contact details with unauthorized third parties.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
