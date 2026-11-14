import Link from "next/link";
import { CheckCircle2, ShieldCheck, MessageCircle, ArrowRight, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartBackButton } from "@/components/layout/SmartBackButton";

export const metadata = {
  title: "Seller Code of Conduct | CampusTrade",
};

export default function VendorGuidelinesPage() {
  return (
    <div className="min-h-screen bg-neutral-50/60 py-10 sm:py-14 px-4">
      <div className="container mx-auto max-w-3xl bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 sm:p-10 space-y-7 text-neutral-800">
        <div>
          {/* Navigation Bar: Smart Back Button + Home */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
            <SmartBackButton
              fallbackUrl="/vendor/register"
              fallbackLabel="Back to Vendor Registration"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 transition-colors"
            />
            <Link
              href="/"
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Home
            </Link>
          </div>

          <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200/80 text-xs font-semibold uppercase tracking-wider mb-2.5 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Seller Guide
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
            Student Vendor Code of Conduct
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Essential guidelines for running a verified, trusted, and high-converting campus store.
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-neutral-600 leading-relaxed">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-900">Accurate Product Conditions</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Always declare whether an item is Brand New, Like New, or Fair. Upload real photographs of the actual items you have in stock.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-900">Responsive WhatsApp Communications</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Respond promptly to buyer inquiries and arrange clear hand-off appointments at designated campus landmarks during daylight hours.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-900">Zero Tolerance for Counterfeits or Scams</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Deceptive listings or counterfeit goods result in immediate account revocation, forfeiture of escrow payouts, and reporting to university authorities.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Card to return seamlessly to registration */}
        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/50 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10 p-6 sm:p-8 rounded-b-3xl">
          <div>
            <p className="font-bold text-sm text-neutral-900">Ready to complete your store setup?</p>
            <p className="text-xs text-neutral-500">Return to your form to finish onboarding your vendor account.</p>
          </div>
          <Link href="/vendor/register">
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-6 h-11 shadow-sm gap-2">
              <Store className="w-4 h-4" />
              <span>Continue Registration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
