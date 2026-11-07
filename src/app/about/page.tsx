import Link from "next/link";
import { GraduationCap, ShieldCheck, Heart, Store, Truck, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustBar } from "@/components/marketplace/TrustBar";

export const metadata = {
  title: "About CampusTrade | University Student Marketplace",
  description: "Learn more about CampusTrade, our mission to empower student sellers, and our safe campus trading network.",
};

export default function AboutPage() {
  const stats = [
    { label: "Active Universities", value: "3+" },
    { label: "Verified Student Vendors", value: "50+" },
    { label: "Products Listed", value: "500+" },
    { label: "Campus Pickups Completed", value: "1,200+" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 via-white to-white py-16 px-4 border-b border-neutral-100">
        <div className="container mx-auto max-w-3xl text-center space-y-4">
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold uppercase tracking-wider">
            Our Mission & Story
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-950 tracking-tight leading-tight">
            Empowering Student Commerce Across Nigerian Campuses
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            CampusTrade is built from the ground up for university students. We solve the friction of buying and selling textbooks, tech gadgets, hostel essentials, and thrift fashion with zero middlemen and verified campus safety.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-3xl bg-neutral-900 text-white shadow-xl">
          {stats.map((s, i) => (
            <div key={i} className="text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">{s.value}</p>
              <p className="text-xs text-neutral-300 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Core Values */}
      <section className="py-16 container mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
            Why Students Choose CampusTrade
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Designed specifically around the unique dynamics of Nigerian university life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-100 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-neutral-900">100% Student Verified</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Every vendor profile is reviewed by campus admins with student matriculation cards, ensuring genuine students and deterring fraudulent listings.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-100 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-neutral-900">Zero Delivery Stress</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              No long interstate couriers or dispatch delays. Sellers and buyers meet conveniently right inside campus hostels, SUBs, and faculty quadrangles.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-neutral-50 border border-neutral-100 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-neutral-900">Student Entrepreneurship</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              We empower student creators, thrifters, and techies to build a brand with customized storefront templates and direct WhatsApp order requests.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <TrustBar />

      {/* CTA Box */}
      <section className="py-16 container mx-auto px-4">
        <div className="p-10 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white text-center max-w-3xl mx-auto space-y-5 shadow-xl shadow-emerald-600/20">
          <GraduationCap className="w-12 h-12 mx-auto text-emerald-200" />
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Start Trading on Your Campus?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto">
            Whether you want to discover deals on textbooks and gadgets or start selling your own products, CampusTrade is here for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/shop">
              <Button size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 font-bold px-6 shadow-md text-xs">
                Explore Marketplace &rarr;
              </Button>
            </Link>
            <Link href="/vendor/register">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold px-6 text-xs">
                Open a Student Store
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
