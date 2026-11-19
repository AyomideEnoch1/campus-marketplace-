"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys, ProductFilterParams } from "@/lib/react-query/query-keys";

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  condition: string;
  status: string;
  viewsCount?: number;
  images: { id: string; url: string; position: number; altText?: string | null }[];
  category: { id: string; name: string; slug: string };
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    whatsapp?: string | null;
    sellerType?: string;
    isRegisteredBusiness?: boolean;
    isTrustedSeller?: boolean;
    verificationTier?: number;
    campus?: { id?: string; name: string; slug: string; city?: string } | null;
  };
}

export interface ProductsResponse {
  products: ProductItem[];
  total: number;
  limit: number;
  offset: number;
}

async function fetchProducts(
  filters: ProductFilterParams = {},
  signal?: AbortSignal
): Promise<ProductsResponse> {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.campus) params.set("campus", filters.campus);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.vendor) params.set("vendor", filters.vendor);
  if (filters.sellerType) params.set("sellerType", filters.sellerType);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const url = `/api/products${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch products");
  }

  return res.json();
}

/**
 * Hook to fetch paginated/filtered products.
 * Uses 5 minutes staleTime, background refetching, and keeps previous data during filter changes.
 */
export function useProducts(filters: ProductFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: ({ signal }) => fetchProducts(filters, signal),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook for optimized search requests.
 * - Supports debouncing
 * - Ignores empty or invalid search queries
 * - Uses search query as part of query key
 * - Caches previous results
 * - Automatically cancels outdated requests via AbortSignal
 */
export function useSearchProducts(
  searchTerm: string,
  campus?: string,
  options: { enabled?: boolean; limit?: number } = {}
) {
  const trimmed = searchTerm.trim();
  const isQueryValid = trimmed.length >= 2;
  const isEnabled = options.enabled !== undefined ? options.enabled && isQueryValid : isQueryValid;

  return useQuery({
    queryKey: queryKeys.products.search(trimmed, campus),
    queryFn: ({ signal }) =>
      fetchProducts({ q: trimmed, campus, limit: options.limit || 8 }, signal),
    enabled: isEnabled,
    staleTime: 3 * 60 * 1000, // 3 minutes for search results
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
