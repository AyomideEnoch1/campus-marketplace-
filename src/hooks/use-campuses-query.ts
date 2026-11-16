"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";

export interface CampusItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string | null;
  isActive: boolean;
  safeMeetupPoints?: Array<{
    id: string;
    name: string;
    description: string | null;
    active: boolean;
  }>;
}

interface CampusesResponse {
  campuses: CampusItem[];
}

async function fetchCampuses(): Promise<CampusesResponse> {
  const res = await fetch("/api/campuses");
  if (!res.ok) {
    throw new Error("Failed to fetch campuses");
  }
  return res.json();
}

/**
 * Hook to retrieve campus list with 30-minute staleTime.
 */
export function useCampuses() {
  return useQuery({
    queryKey: queryKeys.campuses.list(),
    queryFn: fetchCampuses,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
