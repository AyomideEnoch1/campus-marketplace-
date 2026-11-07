import Link from "next/link";
import { GraduationCap, ShieldCheck, MapPin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400 pt-16 pb-24 md:pb-12 border-t border-neutral-900 transition-colors">
      <div className="container mx-auto px-4">
        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                Campus<span className="text-emerald-500">Trade</span>
              </span>
            </Link>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              The premier student-to-student marketplace across Nigerian universities. Buy and sell textbooks, fashion, tech gadgets, and hostel essentials with zero stress.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-neutral-900 text-emerald-400 border border-neutral-800">
                <MapPin className="w-3 h-3" /> UNILAG Akoka
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-neutral-900 text-emerald-400 border border-neutral-800">
                <MapPin className="w-3 h-3" /> UI Ibadan
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-neutral-900 text-emerald-400 border border-neutral-800">
                <MapPin className="w-3 h-3" /> OAU Ile-Ife
              </span>
            </div>
          </div>

          {/* Marketplace Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Marketplace
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop?category=fashion" className="hover:text-white transition-colors">
                  Fashion & Streetwear
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics" className="hover:text-white transition-colors">
                  Laptops & Gadgets
                </Link>
              </li>
              <li>
                <Link href="/shop?category=hostel-essentials" className="hover:text-white transition-colors">
                  Hostel Living Essentials
                </Link>
              </li>
              <li>
                <Link href="/shop?category=books-academics" className="hover:text-white transition-colors">
                  Textbooks & Past Qs
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors font-medium text-emerald-400">
                  View All Products &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Sellers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              For Vendors
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/vendor/register" className="hover:text-white transition-colors">
                  Register as Student Seller
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Vendor Dashboard
                </Link>
              </li>
              <li>
                <Link href="/vendor-guidelines" className="hover:text-white transition-colors">
                  Seller Code of Conduct
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Platform
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition-colors">
                  Campus Anti-Scam Guide
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 flex flex-col md:flex-row items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Student Safety First:</strong> CampusTrade connects student buyers with student sellers. We strongly recommend meeting in daylight at public campus hubs (Library quad, SUB, faculty foyers) to inspect goods before payment.
            </span>
          </div>
          <Link href="/safety" className="text-emerald-400 hover:underline shrink-0 font-medium">
            Read Safety Tips
          </Link>
        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} CampusTrade Technologies Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for Nigerian Students with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
