"use client";

import * as React from "react";
import { CartSnackbar, SnackbarData } from "@/components/ui/CartSnackbar";

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
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearVendorItems: (vendorId: string) => void;
  totalCount: number;
  totalAmount: number;
  itemsByVendor: Record<string, { vendor: CartItem["vendor"]; items: CartItem[]; subtotal: number }>;
  triggerSnackbar?: (data: SnackbarData) => void;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "campus_market_cart_items";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<SnackbarData | null>(null);
  const snackbarTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerSnackbar = React.useCallback((data: SnackbarData) => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current);
    }
    setSnackbar(data);
    snackbarTimerRef.current = setTimeout(() => {
      setSnackbar(null);
    }, 2000); // Does not stay for more than two seconds
  }, []);

  const dismissSnackbar = React.useCallback(() => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current);
    }
    setSnackbar(null);
  }, []);

  React.useEffect(() => {
    return () => {
      if (snackbarTimerRef.current) {
        clearTimeout(snackbarTimerRef.current);
      }
    };
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

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === newItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity || 1;
        return updated;
      }
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });

    triggerSnackbar({
      id: newItem.id,
      type: "added",
      title: newItem.title,
      image: newItem.image,
      price: newItem.price,
    });
  };

  const removeItem = (id: string) => {
    const itemToRemove = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));

    if (itemToRemove) {
      triggerSnackbar({
        id: itemToRemove.id,
        type: "removed",
        title: itemToRemove.title,
        image: itemToRemove.image,
        price: itemToRemove.price,
      });
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const clearVendorItems = (vendorId: string) => {
    setItems((prev) => prev.filter((i) => i.vendor.id !== vendorId));
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Group items by vendor (Section 4.5 requirement)
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
      }}
    >
      {children}
      <CartSnackbar data={snackbar} onDismiss={dismissSnackbar} />
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
