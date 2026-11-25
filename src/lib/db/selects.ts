/**
 * Shared Prisma field selections and pagination limits.
 *
 * GUARDRAIL: Never add implicit full-row queries (`select('*')` or `findMany()` without `select` and `take`).
 * Always pick explicit UI fields from this module and bound every list query.
 */

import type { Prisma } from "@prisma/client";

export const DEFAULT_PAGE_SIZE = 16;
export const MAX_PAGE_SIZE = 24;
export const MAX_ADMIN_PAGE_SIZE = 50;

export function clampPage(rawPage?: string | number | null): number {
  const num = typeof rawPage === "number" ? rawPage : parseInt(String(rawPage || "1"), 10);
  return Number.isFinite(num) && num >= 1 ? Math.floor(num) : 1;
}

export function clampLimit(
  rawLimit?: string | number | null,
  fallback = DEFAULT_PAGE_SIZE,
  max = MAX_PAGE_SIZE
): number {
  const num = typeof rawLimit === "number" ? rawLimit : parseInt(String(rawLimit || fallback), 10);
  if (!Number.isFinite(num) || num < 1) return fallback;
  return Math.min(Math.floor(num), max);
}

/**
 * Minimal product card fields rendered by ProductCard / grid lists.
 * Intentionally omits large columns (`description`, `ratingBreakdown`, `model3dUrl`, `videoUrl`).
 */
export const PRODUCT_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  comparePrice: true,
  stock: true,
  condition: true,
  status: true,
  isFeatured: true,
  reviewCount: true,
  avgRating: true,
  createdAt: true,
  images: {
    orderBy: { position: "asc" as const },
    take: 4,
    select: {
      id: true,
      url: true,
      position: true,
      altText: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  vendor: {
    select: {
      id: true,
      storeName: true,
      slug: true,
      whatsapp: true,
      sellerType: true,
      verificationTier: true,
      isTrustedSeller: true,
      isRegisteredBusiness: true,
      campus: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

/**
 * Public vendor fields safe for storefront & product pages.
 * Explicitly excludes private verification/bank/admin columns.
 */
export const VENDOR_PUBLIC_SELECT = {
  id: true,
  userId: true,
  campusId: true,
  storeName: true,
  slug: true,
  storeDescription: true,
  logo: true,
  banner: true,
  layout: true,
  brandColor: true,
  whatsapp: true,
  faculty: true,
  department: true,
  sellerType: true,
  verificationTier: true,
  businessName: true,
  businessCategory: true,
  isRegisteredBusiness: true,
  isTrustedSeller: true,
  status: true,
  sellerAvgRating: true,
  sellerReviewCount: true,
  communicationAvg: true,
  punctualityAvg: true,
  behaviorAvg: true,
  createdAt: true,
  campus: {
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
    },
  },
} as const;

/**
 * Lightweight vendor card fields for homepage & directory grids.
 */
export const VENDOR_CARD_SELECT = {
  id: true,
  storeName: true,
  slug: true,
  storeDescription: true,
  logo: true,
  banner: true,
  layout: true,
  brandColor: true,
  faculty: true,
  sellerType: true,
  isTrustedSeller: true,
  isRegisteredBusiness: true,
  campus: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  _count: {
    select: {
      products: true,
    },
  },
} as const;

/**
 * Full product detail selection for `/product/[slug]`.
 */
export const PRODUCT_DETAIL_SELECT = {
  id: true,
  vendorId: true,
  categoryId: true,
  title: true,
  slug: true,
  description: true,
  price: true,
  comparePrice: true,
  stock: true,
  condition: true,
  status: true,
  model3dUrl: true,
  videoUrl: true,
  tags: true,
  viewsCount: true,
  isFeatured: true,
  reviewCount: true,
  avgRating: true,
  createdAt: true,
  images: {
    orderBy: { position: "asc" as const },
    select: {
      id: true,
      url: true,
      position: true,
      altText: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  variants: {
    select: {
      id: true,
      name: true,
      value: true,
      priceAdjustment: true,
      stock: true,
      sku: true,
    },
  },
  vendor: {
    select: VENDOR_PUBLIC_SELECT,
  },
} satisfies Prisma.ProductSelect;
