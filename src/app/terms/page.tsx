import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Terms of Service | CampusTrade",
};

export default function TermsPage() {
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
            Legal Terms
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Last updated: November 2026</p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-bold text-base text-neutral-900">1. Acceptance of Terms</h2>
            <p>
              By accessing and using CampusTrade, you acknowledge that you are an active student, vendor, or authorized visitor, and agree to adhere to these terms and university campus rules.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-neutral-900">2. Vendor Conduct & Prohibited Items</h2>
            <p>
              Student vendors agree to list only genuine, legal items. The listing of exam leakages, pirated digital course packs, alcohol, controlled substances, weapons, or contraband is strictly prohibited and leads to immediate suspension and reporting to university authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-neutral-900">3. In-Person Handshakes & Fulfillment</h2>
            <p>
              CampusTrade facilitates peer discovery. The fulfillment of transactions, physical condition inspection, and payments are conducted between buyer and vendor in designated public campus locations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
