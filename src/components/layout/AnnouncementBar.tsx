import Link from "next/link";
import { Sparkles, Truck, ShieldCheck } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="bg-neutral-900 text-white text-xs py-2 px-4 transition-colors">
      <div className="container mx-auto flex items-center justify-between">
        <div className="hidden md:flex items-center gap-6 text-neutral-300">
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Free On-Campus Pickup Points</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Semester Rush Deals: Up to 40% Off</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Student Verified Vendors</span>
          </span>
        </div>

        {/* Mobile single marquee ticker */}
        <div className="md:hidden w-full text-center font-medium flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>🎓 UNILAG, UI & OAU Student Marketplace</span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-neutral-300">
          <Link href="/vendor/register" className="hover:text-white transition-colors text-emerald-400 font-semibold">
            Become a Seller &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
