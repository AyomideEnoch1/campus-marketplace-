"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ShieldCheck, Heart } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export function Footer() {
  const pathname = usePathname();

  // Hide footer completely on chat / messages pages and admin dashboard
  if (
    !pathname ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/dashboard/messages") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  // Remove footer on mobile screen for vendor dashboard pages (e.g. overview page)
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <footer
      className={`bg-gradient-to-b from-neutral-50 via-emerald-50/25 to-neutral-100/80 text-neutral-600 pt-16 pb-24 md:pb-12 border-t border-neutral-200/80 transition-colors ${
        isDashboard ? "hidden md:block" : ""
      }`}
    >
      <div className="container mx-auto px-4">
        {/* Contact / Join ọjà Family Banner */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-neutral-900 to-emerald-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-emerald-800/40">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1.5 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
              <span>Contact & Community</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Join the ọjà Family
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Connect with fellow student buyers, verified campus sellers, and our support team directly on WhatsApp. Stay in the loop with flash deals, promo codes, and campus giveaways!
            </p>
          </div>
          <a
            href="https://chat.whatsapp.com/JayElX9hkHxI0aikwX4aHH"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 relative z-10 w-full sm:w-auto"
          >
            <WhatsAppIcon className="w-5 h-5 fill-current" />
            <span>Join ọjà Family</span>
          </a>
        </div>

        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <span className="font-black text-2xl tracking-tight text-neutral-950 lowercase">
                ọ<span className="text-emerald-600">jà</span>
              </span>
            </Link>
            <p className="text-sm text-neutral-600 max-w-sm leading-relaxed">
              The premier student-to-student marketplace across Nigerian universities. Buy and sell textbooks, fashion, tech gadgets, and hostel essentials with zero stress.
            </p>
            <div className="pt-1">
              <a
                href="https://chat.whatsapp.com/JayElX9hkHxI0aikwX4aHH"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 fill-[#25D366]" />
                <span>Join ọjà Family on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Marketplace Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Marketplace
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop?category=fashion" className="hover:text-emerald-700 transition-colors">
                  Fashion & Streetwear
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics" className="hover:text-emerald-700 transition-colors">
                  Laptops & Gadgets
                </Link>
              </li>
              <li>
                <Link href="/shop?category=hostel-essentials" className="hover:text-emerald-700 transition-colors">
                  Hostel Living Essentials
                </Link>
              </li>
              <li>
                <Link href="/shop?category=books-academics" className="hover:text-emerald-700 transition-colors">
                  Textbooks & Past Qs
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-emerald-800 transition-colors font-semibold text-emerald-600">
                  View All Products &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Sellers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              For Vendors
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/register?role=vendor" className="hover:text-emerald-700 transition-colors">
                  Register as Student Seller
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-700 transition-colors">
                  Vendor Dashboard
                </Link>
              </li>
              <li>
                <Link href="/vendor-guidelines" className="hover:text-emerald-700 transition-colors">
                  Seller Code of Conduct
                </Link>
              </li>
              <li>
                <Link href="/ambassador" className="hover:text-emerald-700 transition-colors font-medium text-emerald-600">
                  Campus Ambassador Hub &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Trust & Community
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-emerald-700 transition-colors">
                  About Platform
                </Link>
              </li>
              <li>
                <a
                  href="https://chat.whatsapp.com/JayElX9hkHxI0aikwX4aHH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366] shrink-0" />
                  <span>Join ọjà Family</span>
                </a>
              </li>
              <li>
                <Link href="/safety" className="hover:text-emerald-700 transition-colors">
                  Campus Anti-Scam Guide
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-700 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-700 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 text-xs text-neutral-700 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8 shadow-xs">
          <p className="leading-relaxed">
            <span className="inline-flex items-center gap-1.5 font-bold text-neutral-900 mr-1.5 align-middle">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Student Safety First:
            </span>
            ọjà connects student buyers with student sellers. We strongly recommend meeting in daylight at public campus hubs (Library quad, SUB, faculty foyers) to inspect goods before payment.
          </p>
          <Link
            href="/safety"
            className="text-emerald-600 hover:text-emerald-700 hover:underline shrink-0 font-semibold self-start md:self-auto"
          >
            Read Safety Tips &rarr;
          </Link>
        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-6 border-t border-neutral-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} ọjà Technologies Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for Nigerian Students with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
