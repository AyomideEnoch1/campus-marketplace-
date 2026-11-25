import Link from "next/link";
import { Sparkles, Truck, ShieldCheck } from "lucide-react";
import { getCachedAnnouncement } from "@/lib/db/queries";
import { AnnouncementBarWrapper } from "./AnnouncementBarWrapper";

export async function AnnouncementBar() {
  const tickerText = await getCachedAnnouncement();

  return (
    <AnnouncementBarWrapper>
      <div className="hidden md:block bg-neutral-900 text-white text-xs py-2 px-4 transition-colors border-b border-neutral-800">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Free On-Campus Pickup Points</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{tickerText}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>100% Student Verified Vendors</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-neutral-300">
            <Link href="/auth/register?role=vendor" className="hover:text-white transition-colors text-white font-semibold">
              Become a Seller &rarr;
            </Link>
          </div>
        </div>
      </div>
    </AnnouncementBarWrapper>
  );
}
