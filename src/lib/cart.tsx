"use client";

import * as React from "react";
import { CartSnackbar, SnackbarData } from "@/components/ui/CartSnackbar";
import { AuthRequiredModal } from "@/components/ui/AuthRequiredModal";
import { useCurrentUser } from "@/hooks/use-auth-query";
import { toast } from "sonner";

export interface CartItem {
  id: string; // product id
  title: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  condition?: string;
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    whatsapp?: string;
    campus?: { id?: string; name: string; slug: string; city?: string };
    sellerType?: "student" | "guest" | string;
    verificationTier?: number;
    isTrustedSeller?: boolean;
    isRegisteredBusiness?: boolean;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<boolean>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  clearVendorItems: (vendorId: string) => void;
  totalCount: number;
  totalAmount: number;
  itemsByVendor: Record<string, { vendor: CartItem["vendor"]; items: CartItem[]; subtotal: number }>;
  triggerSnackbar?: (data: SnackbarData) => void;
  isAuthenticated: boolean;
  user: any;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "campus_market_cart_items";

export interface CartProviderProps {
  children: React.ReactNode;
  initialUser?: any;
}

export function CartProvider({ children, initialUser = null }: CartProviderProps) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<SnackbarData | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  // TanStack Query cached user session: eliminates duplicate network requests on route navigation
  const { data: authData } = useCurrentUser(initialUser);
  const user = authData?.user ?? initialUser;

  const triggerSnackbar = React.useCallback((data: SnackbarData) => {
    setSnackbar(data);
  }, []);

  const dismissSnackbar = React.useCallback(() => {
    setSnackbar(null);
  }, []);

  // Load cart from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse cart storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when items change
  React.useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Failed to save cart storage", e);
      }
    }
  }, [items, isLoaded]);

  /**
   * Optimistically add product to cart.
   * 1. Updates UI immediately with snackbar feedback.
   * 2. Dispatches server-side validation request to verify stock & availability.
   * 3. On failure, rolls back to previous cart snapshot and notifies user via toast.
   */
  const addItem = async (newItem: CartItem): Promise<boolean> => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

    // Preserve previous state for potential rollback
    const previousItems = [...items];
    const requestedQty = newItem.quantity || 1;

    // Calculate optimistic state
    const existingIndex = previousItems.findIndex((i) => i.id === newItem.id);
    let targetQuantity = requestedQty;
    let nextItems: CartItem[];

    if (existingIndex > -1) {
      nextItems = previousItems.map((item, idx) => {
        if (idx === existingIndex) {
          targetQuantity = item.quantity + requestedQty;
          return { ...item, quantity: targetQuantity };
        }
        return item;
      });
    } else {
      nextItems = [...previousItems, { ...newItem, quantity: requestedQty }];
    }

    // Apply optimistic update immediately
    setItems(nextItems);
    triggerSnackbar({
      id: newItem.id,
      type: "added",
      title: newItem.title,
      image: newItem.image,
      price: newItem.price,
    });

    // Validate with backend in background
    try {
      const res = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          productId: newItem.id,
          quantity: targetQuantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to add product to cart");
      }

      return true;
    } catch (err: any) {
      // Rollback optimistic update
      console.error("Cart optimistic update failed, rolling back:", err);
      setItems(previousItems);
      setSnackbar(null);
      toast.error(err.message || "Failed to add item to bag. Rolled back.", {
        duration: 4000,
      });
      return false;
    }
  };

  /**
   * Optimistically remove product from cart with rollback on error.
   */
  const removeItem = async (id: string): Promise<void> => {
    const itemToRemove = items.find((i) => i.id === id);
    if (!itemToRemove) return;

    const previousItems = [...items];
    const nextItems = previousItems.filter((i) => i.id !== id);

    // Apply optimistic update
    setItems(nextItems);
    triggerSnackbar({
      id: itemToRemove.id,
      type: "removed",
      title: itemToRemove.title,
      image: itemToRemove.image,
      price: itemToRemove.price,
    });

    try {
      const res = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", productId: id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove item");
      }
    } catch (err: any) {
      // Rollback on failure
      setItems(previousItems);
      toast.error(err.message || "Failed to remove item. Restored to bag.");
    }
  };

  /**
   * Optimistically update item quantity with backend stock check and rollback.
   */
  const updateQuantity = async (id: string, quantity: number): Promise<void> => {
    if (quantity <= 0) {
      await removeItem(id);
      return;
    }

    const previousItems = [...items];
    const nextItems = previousItems.map((i) => (i.id === id ? { ...i, quantity } : i));

    // Apply optimistic update immediately
    setItems(nextItems);

    try {
      const res = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          productId: id,
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Quantity could not be updated");
      }
    } catch (err: any) {
      // Rollback to previous quantity
      setItems(previousItems);
      toast.error(err.message || "Failed to update item quantity. Restoring original amount.");
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const clearVendorItems = (vendorId: string) => {
    setItems((prev) => prev.filter((i) => i.vendor.id !== vendorId && i.vendor.slug !== vendorId));
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Group items by vendor
  const itemsByVendor = React.useMemo(() => {
    const groups: Record<
      string,
      { vendor: CartItem["vendor"]; items: CartItem[]; subtotal: number }
    > = {};

    items.forEach((item) => {
      const vId = item.vendor.id;
      if (!groups[vId]) {
        groups[vId] = {
          vendor: item.vendor,
          items: [],
          subtotal: 0,
        };
      }
      groups[vId].items.push(item);
      groups[vId].subtotal += item.price * item.quantity;
    });

    return groups;
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        clearVendorItems,
        totalCount,
        totalAmount,
        itemsByVendor,
        triggerSnackbar,
        isAuthenticated: !!user,
        user,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        isAuthModalOpen,
      }}
    >
      {children}
      <CartSnackbar data={snackbar} onDismiss={dismissSnackbar} duration={3000} />
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
