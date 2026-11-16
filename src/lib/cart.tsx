"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CartSnackbar, SnackbarData } from "@/components/ui/CartSnackbar";
import { AuthRequiredModal } from "@/components/ui/AuthRequiredModal";

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
  addItem: (item: CartItem) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
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
  const [user, setUser] = React.useState<any>(initialUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  const pathname = usePathname();

  React.useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Sync user authentication status with backend when route changes
  const prevPathnameRef = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPathnameRef.current === pathname && initialUser !== undefined) {
      return;
    }
    prevPathnameRef.current = pathname;

    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.user) {
          setUser(data.user);
        } else if (data === null) {
          setUser(null);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [pathname, initialUser]);

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

  const addItem = (newItem: CartItem): boolean => {
    // Prevent unauthenticated users from adding to cart
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }

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

    return true;
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
