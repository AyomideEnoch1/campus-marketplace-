"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useCurrentUser } from "./use-auth-query";

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    title: string;
    images?: { url: string }[];
    slug?: string;
  };
  review?: {
    id: string;
    rating: number;
    status: string;
  } | null;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  deliveryMethod: string;
  deliveryAddress: string;
  meetupPoint?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  notes?: string | null;
  paid_at?: string | Date | null;
  escrow_status?: string | null;
  escrow_mode?: string | null;
  tx_ref?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    whatsapp?: string | null;
    sellerType?: string;
    isTrustedSeller?: boolean;
    isRegisteredBusiness?: boolean;
    campus?: {
      name: string;
      city: string;
    } | null;
  };
  items: OrderItem[];
}

interface OrdersResponse {
  orders: OrderData[];
}

async function fetchOrders(): Promise<OrdersResponse> {
  const res = await fetch("/api/orders");
  if (!res.ok) {
    throw new Error("Failed to load orders");
  }
  return res.json();
}

/**
 * Hook to retrieve user orders.
 * Scoped by the authenticated user ID to prevent data leaks.
 */
export function useOrders(initialOrders?: OrderData[]) {
  const { data: authData } = useCurrentUser();
  const userId = authData?.user?.id;

  return useQuery({
    queryKey: queryKeys.orders.user(userId),
    queryFn: fetchOrders,
    enabled: !!userId,
    initialData: initialOrders ? { orders: initialOrders } : undefined,
    staleTime: 60 * 1000, // 1 minute staleTime for orders
    gcTime: 10 * 60 * 1000,
  });
}

export function useInvalidateOrders() {
  const queryClient = useQueryClient();
  const { data: authData } = useCurrentUser();
  const userId = authData?.user?.id;

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.user(userId) });
  };
}
