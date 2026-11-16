"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder: number;
  children?: CategoryItem[];
  _count?: {
    products: number;
  };
}

interface CategoriesResponse {
  categories: CategoryItem[];
}

async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

/**
 * Hook to retrieve product categories with a 30-minute freshness policy.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes freshness
    gcTime: 60 * 60 * 1000,    // 1 hour cache time
  });
}
