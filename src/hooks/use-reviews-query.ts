"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { queryKeys, ReviewFilterParams } from "@/lib/react-query/query-keys";
import { toast } from "sonner";

export interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  tags: string[];
  photos: string[];
  helpfulCount: number;
  hasVotedHelpful: boolean;
  createdAt: string;
  displayName: string;
  isVerifiedPurchase: boolean;
  isAuthor: boolean;
  canEdit: boolean;
  reply?: {
    id: string;
    body: string;
    createdAt: string;
    storeName: string;
    storeLogo?: string | null;
  } | null;
}

export interface ReviewsResponse {
  reviews: ReviewItem[];
  totalCount: number;
  avgRating: number;
  breakdown: Record<string, number>;
  eligibleOrderItemId?: string | null;
  hasUserReviewed?: boolean;
}

async function fetchProductReviews(
  productId: string,
  filters: ReviewFilterParams = {},
  signal?: AbortSignal
): Promise<ReviewsResponse> {
  const params = new URLSearchParams();
  if (filters.rating && filters.rating !== "ALL") params.append("rating", filters.rating);
  if (filters.withPhotos) params.append("withPhotos", "true");
  if (filters.sort) params.append("sort", filters.sort);

  const res = await fetch(`/api/products/${productId}/reviews?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error("Failed to fetch reviews");
  }
  return res.json();
}

/**
 * Hook to retrieve product reviews with caching and non-flickering filter transitions.
 */
export function useProductReviews(productId: string, filters: ReviewFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.byProduct(productId, filters),
    queryFn: ({ signal }) => fetchProductReviews(productId, filters, signal),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Optimistic mutation for voting a review as helpful.
 * Immediately updates the vote count and button active state in the UI.
 * Automatically rolls back on failure with a toast notification.
 */
export function useHelpfulVoteMutation(productId: string, filters: ReviewFilterParams = {}) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.reviews.byProduct(productId, filters);

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit helpful vote");
      }
      return { reviewId, ...data };
    },
    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousReviews = queryClient.getQueryData<ReviewsResponse>(queryKey);

      if (previousReviews) {
        queryClient.setQueryData<ReviewsResponse>(queryKey, {
          ...previousReviews,
          reviews: previousReviews.reviews.map((r) => {
            if (r.id === reviewId) {
              const nextHasVoted = !r.hasVotedHelpful;
              return {
                ...r,
                hasVotedHelpful: nextHasVoted,
                helpfulCount: nextHasVoted ? r.helpfulCount + 1 : Math.max(0, r.helpfulCount - 1),
              };
            }
            return r;
          }),
        });
      }

      return { previousReviews };
    },
    onError: (err: any, _reviewId, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(queryKey, context.previousReviews);
      }
      toast.error(err.message || "Could not register vote. Reverting.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
