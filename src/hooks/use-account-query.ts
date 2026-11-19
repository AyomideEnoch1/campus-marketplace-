"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useCurrentUser } from "./use-auth-query";
import { toast } from "sonner";

export interface AccountProfileUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  createdAt: string | Date;
  vendorProfile: {
    id: string;
    storeName: string;
    slug: string;
    status: string;
    campus?: {
      id: string;
      name: string;
      city: string;
    } | null;
  } | null;
  orders: any[];
  favoritesCount: number;
  reviewsCount: number;
  totalOrdersCount: number;
}

interface AccountApiResponse {
  user: AccountProfileUser;
}

async function fetchAccountProfile(): Promise<AccountApiResponse> {
  const res = await fetch("/api/account");
  if (!res.ok) {
    throw new Error("Failed to fetch account profile");
  }
  return res.json();
}

/**
 * Hook to retrieve user profile with caching.
 */
export function useAccountProfile(initialUser?: AccountProfileUser) {
  const { data: authData } = useCurrentUser();
  const userId = authData?.user?.id;

  return useQuery({
    queryKey: queryKeys.account.profile(userId),
    queryFn: fetchAccountProfile,
    enabled: !!userId,
    initialData: initialUser ? { user: initialUser } : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

interface UpdateProfilePayload {
  fullName: string;
  phone: string;
}

/**
 * Optimistic mutation for profile updates.
 * - Updates local cache instantly
 * - Rolls back if API fails and displays toast error
 * - Invalidates targeted queries on settle
 */
export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  const { data: authData } = useCurrentUser();
  const userId = authData?.user?.id;
  const profileKey = queryKeys.account.profile(userId);

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      return data;
    },
    onMutate: async (newProfile) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKey });

      // Snapshot previous value
      const previousAccount = queryClient.getQueryData<AccountApiResponse>(profileKey);

      // Optimistically update to the new value
      if (previousAccount?.user) {
        queryClient.setQueryData<AccountApiResponse>(profileKey, {
          ...previousAccount,
          user: {
            ...previousAccount.user,
            fullName: newProfile.fullName,
            phone: newProfile.phone,
          },
        });
      }

      return { previousAccount };
    },
    onError: (err: any, _newProfile, context) => {
      // Roll back to previous snapshot
      if (context?.previousAccount) {
        queryClient.setQueryData(profileKey, context.previousAccount);
      }
      toast.error(err.message || "Failed to update profile. Changes reverted.");
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
    },
    onSettled: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: profileKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
  });
}
