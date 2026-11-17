"use client";

import * as React from "react";
import { useCurrentUser } from "@/hooks/use-auth-query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { toast } from "sonner";

export interface SavedItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image: string;
  condition?: string;
  categoryName?: string;
  vendorName?: string;
  vendorCampus?: string;
}

interface WishlistContextType {
  savedItems: SavedItem[];
  savedCount: number;
  toggleSave: (item: SavedItem) => Promise<void>;
  isSaved: (id: string) => boolean;
  removeItem: (id: string) => Promise<void>;
  clearWishlist: () => void;
  isLoading: boolean;
}

const WishlistContext = React.createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "campus_market_saved_items_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [localItems, setLocalItems] = React.useState<SavedItem[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = React.useState(false);

  const queryClient = useQueryClient();
  const { data: authData } = useCurrentUser();
  const user = authData?.user;
  const userId = user?.id;

  // Load from localStorage on mount (works offline / guest)
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLocalItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved items from localStorage", e);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  // Server-state query when user is authenticated
  const { data: serverWishlistData, isLoading: isServerWishlistLoading } = useQuery({
    queryKey: queryKeys.wishlist.user(userId),
    queryFn: async () => {
      const res = await fetch("/api/wishlist");
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      const data = await res.json();
      return (data.savedItems || []) as SavedItem[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Sync server items with local items when authenticated
  React.useEffect(() => {
    if (userId && serverWishlistData) {
      // Merge unique items by id
      const serverMap = new Map(serverWishlistData.map((item) => [item.id, item]));
      localItems.forEach((item) => {
        if (!serverMap.has(item.id)) {
          serverMap.set(item.id, item);
        }
      });
      const merged = Array.from(serverMap.values());
      setLocalItems(merged);
    }
  }, [userId, serverWishlistData]);

  // Persist to localStorage whenever localItems change
  React.useEffect(() => {
    if (isStorageLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localItems));
      } catch (e) {
        console.error("Failed to save wishlist to localStorage", e);
      }
    }
  }, [localItems, isStorageLoaded]);

  /**
   * Optimistically toggle item in wishlist.
   * Updates state instantly, sends sync request, rolls back on error.
   */
  const toggleSave = React.useCallback(
    async (item: SavedItem) => {
      const previousItems = [...localItems];
      const exists = previousItems.some((p) => p.id === item.id);
      const nextItems = exists
        ? previousItems.filter((p) => p.id !== item.id)
        : [item, ...previousItems];

      // Optimistic state update
      setLocalItems(nextItems);
      if (userId) {
        queryClient.setQueryData(queryKeys.wishlist.user(userId), nextItems);
      }

      if (exists) {
        toast.info(`Removed "${item.title}" from saved items`);
      } else {
        toast.success(`Saved "${item.title}"`);
      }

      // Backend sync
      try {
        const method = exists ? "DELETE" : "POST";
        const url = exists
          ? `/api/wishlist?productId=${encodeURIComponent(item.id)}`
          : "/api/wishlist";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: exists ? undefined : JSON.stringify({ productId: item.id }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update saved items on server");
        }
      } catch (err: any) {
        console.error("Wishlist optimistic toggle failed, rolling back:", err);
        setLocalItems(previousItems);
        if (userId) {
          queryClient.setQueryData(queryKeys.wishlist.user(userId), previousItems);
        }
        toast.error(err.message || "Could not update saved items. Reverting change.");
      }
    },
    [localItems, userId, queryClient]
  );

  const isSaved = React.useCallback(
    (id: string) => {
      return localItems.some((item) => item.id === id);
    },
    [localItems]
  );

  const removeItem = React.useCallback(
    async (id: string) => {
      const itemToRemove = localItems.find((i) => i.id === id);
      if (!itemToRemove) return;

      const previousItems = [...localItems];
      const nextItems = previousItems.filter((i) => i.id !== id);

      setLocalItems(nextItems);
      if (userId) {
        queryClient.setQueryData(queryKeys.wishlist.user(userId), nextItems);
      }
      toast.info(`Removed "${itemToRemove.title}" from saved items`);

      try {
        const res = await fetch(`/api/wishlist?productId=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error("Failed to remove item on server");
        }
      } catch (err: any) {
        setLocalItems(previousItems);
        if (userId) {
          queryClient.setQueryData(queryKeys.wishlist.user(userId), previousItems);
        }
        toast.error("Failed to remove saved item. Restored.");
      }
    },
    [localItems, userId, queryClient]
  );

  const clearWishlist = React.useCallback(() => {
    setLocalItems([]);
    if (userId) {
      queryClient.setQueryData(queryKeys.wishlist.user(userId), []);
    }
  }, [userId, queryClient]);

  return (
    <WishlistContext.Provider
      value={{
        savedItems: localItems,
        savedCount: localItems.length,
        toggleSave,
        isSaved,
        removeItem,
        clearWishlist,
        isLoading: isServerWishlistLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = React.useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
