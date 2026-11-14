import Link from "next/link";
import { GraduationCap, ShieldCheck, MapPin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-neutral-50 via-emerald-50/25 to-neutral-100/80 text-neutral-600 pt-16 pb-24 md:pb-12 border-t border-neutral-200/80 transition-colors">
      <div className="container mx-auto px-4">
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-neutral-950">
                Campus<span className="text-emerald-600">Trade</span>
              </span>
            </Link>
            <p className="text-sm text-neutral-600 max-w-sm leading-relaxed">
              The premier student-to-student marketplace across Nigerian universities. Buy and sell textbooks, fashion, tech gadgets, and hostel essentials with zero stress.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white text-emerald-800 border border-emerald-100 font-medium shadow-2xs">
                <MapPin className="w-3 h-3 text-emerald-600" /> UNILAG Akoka
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white text-emerald-800 border border-emerald-100 font-medium shadow-2xs">
                <MapPin className="w-3 h-3 text-emerald-600" /> UI Ibadan
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-white text-emerald-800 border border-emerald-100 font-medium shadow-2xs">
                <MapPin className="w-3 h-3 text-emerald-600" /> OAU Ile-Ife
              </span>
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
                <Link href="/vendor/register" className="hover:text-emerald-700 transition-colors">
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
            </ul>
          </div>

          {/* Safety & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-emerald-700 transition-colors">
                  About Platform
                </Link>
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
            CampusTrade connects student buyers with student sellers. We strongly recommend meeting in daylight at public campus hubs (Library quad, SUB, faculty foyers) to inspect goods before payment.
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
          <p>&copy; {new Date().getFullYear()} CampusTrade Technologies Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for Nigerian Students with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
