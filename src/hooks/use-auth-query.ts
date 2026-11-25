"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  vendorProfile?: {
    id: string;
    storeName: string;
    slug: string;
    status: string;
    campus?: {
      id?: string;
      name?: string;
      slug?: string;
      city?: string;
    };
  } | null;
}

interface AuthResponse {
  user: AuthUser | null;
}

async function fetchCurrentUser(): Promise<AuthResponse> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) {
    if (res.status === 401) {
      return { user: null };
    }
    throw new Error("Failed to check auth status");
  }
  const data = await res.json();
  return { user: data?.user || null };
}

/**
 * Hook to retrieve the currently logged in user session.
 * Caches the response and deduplicates requests across components.
 * Supports seeding initialData from server layouts to prevent client waterfalls.
 */
export function useCurrentUser(initialUser?: AuthUser | null) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchCurrentUser,
    initialData: initialUser !== undefined ? { user: initialUser } : undefined,
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Mutation hook for logout that completely flushes user-specific query caches,
 * preventing data leakage between authenticated users.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        throw new Error("Logout failed");
      }
      return res.json();
    },
    onSuccess: () => {
      // Set auth.me to null immediately
      queryClient.setQueryData(queryKeys.auth.me(), { user: null });

      // Invalidate and remove private user data
      queryClient.removeQueries({ queryKey: queryKeys.account.all });
      queryClient.removeQueries({ queryKey: queryKeys.orders.all });
      queryClient.removeQueries({ queryKey: queryKeys.cart.all });
      queryClient.removeQueries({ queryKey: queryKeys.wishlist.all });

      router.push("/");
      router.refresh();
    },
  });
}
