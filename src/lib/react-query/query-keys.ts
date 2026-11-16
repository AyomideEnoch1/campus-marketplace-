/**
 * Centralized Query Key Factory
 *
 * Provides typed, predictable query keys for TanStack Query.
 * Hierarchical structure ensures fine-grained invalidation without wiping unrelated caches.
 */

export interface ProductFilterParams {
  category?: string;
  campus?: string;
  condition?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sort?: string;
  vendor?: string;
  sellerType?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ReviewFilterParams {
  rating?: string;
  withPhotos?: boolean;
  sort?: string;
}

export const queryKeys = {
  // Auth & Session
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
    user: (id?: string) => [...queryKeys.auth.all, "user", id || "anonymous"] as const,
  },

  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: ProductFilterParams = {}) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (idOrSlug: string) => [...queryKeys.products.details(), idOrSlug] as const,
    search: (query: string, campus?: string) =>
      [...queryKeys.products.all, "search", { query, campus: campus || null }] as const,
    featured: () => [...queryKeys.products.all, "featured"] as const,
  },

  // Categories
  categories: {
    all: ["categories"] as const,
    list: () => [...queryKeys.categories.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.categories.all, "detail", slug] as const,
  },

  // Campuses
  campuses: {
    all: ["campuses"] as const,
    list: () => [...queryKeys.campuses.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.campuses.all, "detail", slug] as const,
  },

  // Safe Meetup Points
  meetupPoints: {
    all: ["meetup-points"] as const,
    byVendor: (vendorId: string) => [...queryKeys.meetupPoints.all, "vendor", vendorId] as const,
    byCampus: (campusId: string) => [...queryKeys.meetupPoints.all, "campus", campusId] as const,
  },

  // Cart
  cart: {
    all: ["cart"] as const,
    user: (userId?: string) => [...queryKeys.cart.all, userId || "guest"] as const,
  },

  // Wishlist / Favorites
  wishlist: {
    all: ["wishlist"] as const,
    user: (userId?: string) => [...queryKeys.wishlist.all, userId || "guest"] as const,
  },

  // Orders
  orders: {
    all: ["orders"] as const,
    user: (userId?: string) => [...queryKeys.orders.all, "user", userId || "me"] as const,
    detail: (orderNumberOrId: string) => [...queryKeys.orders.all, "detail", orderNumberOrId] as const,
  },

  // Reviews
  reviews: {
    all: ["reviews"] as const,
    byProduct: (productId: string, filters: ReviewFilterParams = {}) =>
      [...queryKeys.reviews.all, "product", productId, filters] as const,
  },

  // User Profile / Account
  account: {
    all: ["account"] as const,
    profile: (userId?: string) => [...queryKeys.account.all, "profile", userId || "me"] as const,
  },
};
