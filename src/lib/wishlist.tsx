"use client";

import * as React from "react";

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
  toggleSave: (item: SavedItem) => void;
  isSaved: (id: string) => boolean;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = React.createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "campus_market_saved_items_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [savedItems, setSavedItems] = React.useState<SavedItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved items from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  React.useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
      } catch (e) {
        console.error("Failed to save wishlist to localStorage", e);
      }
    }
  }, [savedItems, isLoaded]);

  const toggleSave = React.useCallback((item: SavedItem) => {
    setSavedItems((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      } else {
        return [item, ...prev];
      }
    });
  }, []);

  const isSaved = React.useCallback(
    (id: string) => {
      return savedItems.some((item) => item.id === id);
    },
    [savedItems]
  );

  const removeItem = React.useCallback((id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearWishlist = React.useCallback(() => {
    setSavedItems([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        savedItems,
        savedCount: savedItems.length,
        toggleSave,
        isSaved,
        removeItem,
        clearWishlist,
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
