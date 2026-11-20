"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ref = searchParams?.get("ref") || searchParams?.get("ambassador");
    if (!ref) return;

    const cleanCode = ref.trim().toUpperCase();

    // Store in cookie for 30 days (2592000 seconds)
    document.cookie = `campus_ref=${encodeURIComponent(
      cleanCode
    )}; max-age=2592000; path=/; SameSite=Lax`;

    // Also store in localStorage as reliable client backup
    try {
      localStorage.setItem("campus_ref", cleanCode);
      localStorage.setItem("campus_ref_time", Date.now().toString());
    } catch {
      // ignore storage errors
    }

    // Fire beacon to record click metric
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/ambassador/track",
          new Blob([JSON.stringify({ code: cleanCode })], { type: "application/json" })
        );
      } else {
        fetch("/api/ambassador/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: cleanCode }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // silent catch for analytics tracking
    }
  }, [searchParams]);

  return null;
}
