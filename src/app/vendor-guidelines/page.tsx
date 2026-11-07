import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, MessageCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Seller Code of Conduct | CampusTrade",
};

export default function VendorGuidelinesPage() {
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
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2 block w-fit">
            Seller Guide
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
            Student Vendor Code of Conduct
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Best practices for running a trusted, high-converting campus store.</p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-900">Accurate Product Conditions</p>
              <p className="text-xs text-neutral-500">Always declare whether an item is Brand New, Like New, or Fair. Upload real photographs of actual items.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-900">Responsive WhatsApp Communications</p>
              <p className="text-xs text-neutral-500">Respond promptly to buyer order inquiries and agree on clear pickup hours at campus landmarks.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-900">Zero Toleration for Counterfeits or Contraband</p>
              <p className="text-xs text-neutral-500">Violations will result in instant permanent store ban and reporting to university authorities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
