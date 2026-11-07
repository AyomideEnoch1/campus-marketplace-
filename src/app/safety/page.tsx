import Link from "next/link";
import { ShieldCheck, AlertTriangle, Eye, CheckCircle, MapPin, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Campus Safety & Anti-Scam Guide | CampusTrade",
  description: "Crucial guidelines for safe peer-to-peer product transactions on university campuses.",
};

export default function SafetyPage() {
  const safetyRules = [
    {
      title: "1. Always Meet in Daylight at Public Campus Spots",
      desc: "Arrange handshakes at well-known, busy campus landmarks such as the University Library steps, Student Union Building (SUB), faculty cafeterias, or sports complexes. Avoid secluded quarters or private rooms after dark.",
      icon: MapPin,
    },
    {
      title: "2. Inspect the Item Thoroughly Before Handing Over Money",
      desc: "Check electronic gadgets (test cameras, Wi-Fi, battery health, charging ports, and screen response). For textbooks, verify edition and syllabus alignment. For clothing, verify sizes and fabric quality.",
      icon: Eye,
    },
    {
      title: "3. Never Send Advance Payments for Uninspected Goods",
      desc: "Do not wire money or transfer deposits to a seller before seeing and confirming the product in person. Genuine student sellers will gladly meet you at a campus pickup point.",
      icon: AlertTriangle,
    },
    {
      title: "4. Verify Student Status",
      desc: "All approved vendors on CampusTrade have verified campus credentials. If something looks suspicious or too good to be true, ask to see their student ID card or report the listing to platform admins.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/60 py-12 px-4">
      <div className="container mx-auto max-w-3xl bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 sm:p-10 space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2 block w-fit">
            Buyer & Seller Protection
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
            Campus Safety & Anti-Scam Guide
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Essential guidelines to ensure every campus transaction is transparent, safe, and stress-free.
          </p>
        </div>

        <div className="space-y-4">
          {safetyRules.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900">
                    {r.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs leading-relaxed space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            Notice Concerning Platform Facilitation
          </p>
          <p>
            CampusTrade serves as an open marketplace connecting student buyers and sellers on campus. Always exercise sound judgment during transactions. Report any suspicious behavior or fraudulent vendors immediately to <a href="mailto:safety@unitrade.ng" className="underline font-bold">safety@unitrade.ng</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
