"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";

export interface SafeMeetupPoint {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface VendorMeta {
  id: string;
  sellerType: "student" | "guest" | string;
  verificationTier: number;
  isTrustedSeller: boolean;
  isRegisteredBusiness: boolean;
  storeName: string;
  campusId: string;
  campus?: {
    id: string;
    name: string;
    city: string;
  };
}

interface MeetupPointsResponse {
  vendor: VendorMeta;
  meetupPoints: SafeMeetupPoint[];
}

async function fetchSafeMeetupPoints(vendorId: string): Promise<MeetupPointsResponse> {
  const res = await fetch(`/api/safe-meetup-points?vendorId=${encodeURIComponent(vendorId)}`);
  if (!res.ok) {
    throw new Error("Failed to fetch safe meetup points");
  }
  return res.json();
}

/**
 * Cached query hook for safe meetup points and vendor safety metadata during checkout.
 * Avoids refetching when user toggles delivery options.
 */
export function useSafeMeetupPoints(vendorId?: string) {
  return useQuery({
    queryKey: queryKeys.meetupPoints.byVendor(vendorId || ""),
    queryFn: () => fetchSafeMeetupPoints(vendorId!),
    enabled: !!vendorId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}
