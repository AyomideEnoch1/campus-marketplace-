import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEffectiveProductPrice } from "@/lib/promotions";
import {
  DEFAULT_PAGE_SIZE,
  PRODUCT_CARD_SELECT,
  PRODUCT_DETAIL_SELECT,
  VENDOR_CARD_SELECT,
  VENDOR_PUBLIC_SELECT,
  clampLimit,
  clampPage,
} from "./selects";

/**
 * Shared cached & bounded data-access layer for public marketplace queries.
 * Uses Next.js `unstable_cache` (short TTL) + `React.cache` per-request deduplication
 * so crawlers, repeated mounts, and metadata+page renders don't hammer Postgres.
 */

let promotionsTableMissing = false;

async function attachPromotions<T extends { id: string }>(
  products: T[],
  statuses: Array<"ACTIVE" | "SCHEDULED"> = ["ACTIVE"]
): Promise<(T & { promotions: any[] })[]> {
  if (products.length === 0 || promotionsTableMissing) {
    return products.map((p) => ({ ...p, promotions: [] }));
  }

  try {
    const ids = products.map((p) => p.id);
    const promos = await prisma.promotion.findMany({
      where: {
        productId: { in: ids },
        status: { in: statuses },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        productId: true,
        label: true,
        discountType: true,
        discountValue: true,
        promoPrice: true,
        startAt: true,
        endAt: true,
        status: true,
      },
    });

    const promoMap = new Map<string, any[]>();
    for (const promo of promos) {
      const list = promoMap.get(promo.productId) || [];
      list.push(promo);
      promoMap.set(promo.productId, list);
    }

    return products.map((p) => ({
      ...p,
      promotions: promoMap.get(p.id) || [],
    }));
  } catch (err: any) {
    if (err?.code === "P2021") {
      // Production DB may not have the Promotion table migrated yet.
      promotionsTableMissing = true;
      return products.map((p) => ({ ...p, promotions: [] }));
    }
    throw err;
  }
}

export const getCachedAnnouncement = unstable_cache(
  async (): Promise<string> => {
    const fallback = "Semester Rush Deals: Up to 40% Off";
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: "announcement_bar" },
        select: { value: true },
      });
      return setting?.value?.trim() || fallback;
    } catch {
      return fallback;
    }
  },
  ["announcement-bar"],
  { revalidate: 300, tags: ["site-settings"] }
);

export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 30,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        sortOrder: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                products: { where: { status: "PUBLISHED" } },
              },
            },
          },
        },
        _count: {
          select: {
            products: { where: { status: "PUBLISHED" } },
          },
        },
      },
    });
  },
  ["public-categories"],
  { revalidate: 300, tags: ["categories", "products"] }
);

export const getCachedCampuses = unstable_cache(
  async () => {
    return prisma.campus.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 50,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        state: true,
        settings: {
          select: {
            id: true,
            guestVendorsEnabled: true,
            guestVendorCap: true,
          },
        },
        safeMeetupPoints: {
          where: { active: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            vendors: {
              where: {
                sellerType: "guest",
                status: "APPROVED",
              },
            },
          },
        },
      },
    });
  },
  ["public-campuses"],
  { revalidate: 300, tags: ["campuses"] }
);

export const getCachedHomepageData = unstable_cache(
  async () => {
    try {
      const [categories, campuses, newArrivalsRaw, featuredRaw, vendors, siteSettings, totalProductCount] =
        await Promise.all([
          prisma.category.findMany({
            where: { parentId: null, isActive: true },
            take: 8,
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
              children: {
                select: {
                  _count: {
                    select: {
                      products: { where: { status: "PUBLISHED" } },
                    },
                  },
                },
              },
              _count: {
                select: {
                  products: { where: { status: "PUBLISHED" } },
                },
              },
            },
          }),
          prisma.campus.findMany({
            where: { isActive: true },
            take: 20,
            select: { id: true, name: true, slug: true, city: true },
          }),
          prisma.product.findMany({
            where: { status: "PUBLISHED" },
            take: 8,
            orderBy: { createdAt: "desc" },
            select: PRODUCT_CARD_SELECT,
          }),
          prisma.product.findMany({
            where: { status: "PUBLISHED", isFeatured: true },
            take: 6,
            orderBy: { createdAt: "desc" },
            select: PRODUCT_CARD_SELECT,
          }),
          prisma.vendorProfile.findMany({
            where: { status: "APPROVED" },
            take: 6,
            orderBy: { createdAt: "desc" },
            select: VENDOR_CARD_SELECT,
          }),
          prisma.siteSetting.findMany({
            where: {
              key: {
                in: [
                  "hero_badge",
                  "hero_title",
                  "hero_subtitle",
                  "hero_cta_text",
                  "flash_sale_badge",
                  "flash_sale_title",
                  "flash_sale_subtitle",
                  "seller_promo_title",
                  "seller_promo_subtitle",
                ],
              },
            },
            select: { key: true, value: true },
          }),
          prisma.product.count({ where: { status: "PUBLISHED" } }),
        ]);

      const [newArrivalsWithPromos, featuredWithPromos] = await Promise.all([
        attachPromotions(newArrivalsRaw, ["ACTIVE"]),
        attachPromotions(featuredRaw, ["ACTIVE"]),
      ]);

      const now = new Date();
      const formatWithPromo = (list: any[]) =>
        list.map((p) => {
          const info = getEffectiveProductPrice(p, now);
          return {
            ...p,
            effectivePrice: info.effectivePrice,
            promo: info.activePromo,
            activePromo: info.activePromo,
          };
        });

      const cmsSettings: Record<string, string> = {};
      siteSettings.forEach((s) => {
        cmsSettings[s.key] = s.value;
      });

      return {
        categories,
        campuses,
        newArrivals: formatWithPromo(newArrivalsWithPromos),
        featuredProducts: formatWithPromo(featuredWithPromos),
        vendors,
        cmsSettings,
        totalProductCount,
      };
    } catch (error) {
      console.error("Error loading homepage data:", error);
      return {
        categories: [],
        campuses: [],
        newArrivals: [],
        featuredProducts: [],
        vendors: [],
        cmsSettings: {},
        totalProductCount: 0,
      };
    }
  },
  ["homepage-data"],
  { revalidate: 60, tags: ["products", "categories", "campuses", "vendors", "site-settings"] }
);

export interface ShopFilterInput {
  q?: string | null;
  category?: string | null;
  campus?: string | null;
  condition?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  sort?: string | null;
  vendor?: string | null;
  sellerType?: string | null;
  page?: number;
  limit?: number;
  offset?: number;
}

export async function queryPaginatedProducts(input: ShopFilterInput) {
  const limit = clampLimit(input.limit, DEFAULT_PAGE_SIZE);
  const page = clampPage(input.page);
  const skip = input.offset !== undefined ? Math.max(0, input.offset) : (page - 1) * limit;

  const where: any = {
    status: "PUBLISHED",
  };

  if (input.category) {
    const matchedCategory = await prisma.category.findUnique({
      where: { slug: input.category },
      select: {
        slug: true,
        children: { select: { slug: true } },
      },
    });

    if (matchedCategory && matchedCategory.children.length > 0) {
      where.category = {
        slug: { in: [matchedCategory.slug, ...matchedCategory.children.map((c) => c.slug)] },
      };
    } else {
      where.category = { slug: input.category };
    }
  }

  if (input.campus) {
    where.vendor = {
      campus: { slug: input.campus },
    };
  }

  if (input.vendor) {
    where.vendor = {
      ...(where.vendor || {}),
      slug: input.vendor,
    };
  }

  if (input.sellerType && (input.sellerType === "student" || input.sellerType === "guest")) {
    where.vendor = {
      ...(where.vendor || {}),
      sellerType: input.sellerType,
    };
  }

  if (input.condition) {
    where.condition = input.condition;
  }

  if (input.minPrice || input.maxPrice) {
    where.price = {};
    if (input.minPrice) where.price.gte = parseFloat(input.minPrice);
    if (input.maxPrice) where.price.lte = parseFloat(input.maxPrice);
  }

  const rawQ = input.q?.trim() || "";
  if (rawQ) {
    where.OR = [
      { title: { contains: rawQ, mode: "insensitive" } },
      { description: { contains: rawQ, mode: "insensitive" } },
      { tags: { contains: rawQ, mode: "insensitive" } },
      { category: { name: { contains: rawQ, mode: "insensitive" } } },
      { vendor: { storeName: { contains: rawQ, mode: "insensitive" } } },
      { vendor: { slug: { contains: rawQ, mode: "insensitive" } } },
      { vendor: { user: { fullName: { contains: rawQ, mode: "insensitive" } } } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (input.sort === "price-asc") orderBy = { price: "asc" };
  if (input.sort === "price-desc") orderBy = { price: "desc" };
  if (input.sort === "popular") orderBy = { viewsCount: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip,
      select: PRODUCT_CARD_SELECT,
    }),
    prisma.product.count({ where }),
  ]);

  const productsWithPromos = await attachPromotions(products, ["ACTIVE"]);
  const now = new Date();
  const formatted = productsWithPromos.map((prod: any) => {
    const priceInfo = getEffectiveProductPrice(prod, now);
    return {
      ...prod,
      price: priceInfo.effectivePrice,
      originalPrice: priceInfo.originalPrice,
      comparePrice: priceInfo.comparePrice,
      effectivePrice: priceInfo.effectivePrice,
      promo: priceInfo.activePromo,
      activePromo: priceInfo.activePromo,
    };
  });

  return {
    products: formatted,
    total,
    limit,
    offset: skip,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export const getCachedShopSidebarVendors = unstable_cache(
  async () => {
    return prisma.vendorProfile.findMany({
      where: { status: "APPROVED" },
      take: 40,
      orderBy: { storeName: "asc" },
      select: {
        id: true,
        storeName: true,
        slug: true,
        campus: { select: { name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });
  },
  ["shop-sidebar-vendors"],
  { revalidate: 120, tags: ["vendors"] }
);

export const getCachedVendorsPageData = unstable_cache(
  async (campusSlug?: string, page = 1, limit = 18) => {
    const safeLimit = clampLimit(limit, 18);
    const safePage = clampPage(page);
    const where: any = { status: "APPROVED" };
    if (campusSlug) {
      where.campus = { slug: campusSlug };
    }

    const [vendors, totalVendors, campuses] = await Promise.all([
      prisma.vendorProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: safeLimit,
        skip: (safePage - 1) * safeLimit,
        select: VENDOR_CARD_SELECT,
      }),
      prisma.vendorProfile.count({ where }),
      prisma.campus.findMany({
        where: { isActive: true },
        take: 30,
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return {
      vendors,
      totalVendors,
      totalPages: Math.max(1, Math.ceil(totalVendors / safeLimit)),
      page: safePage,
      campuses,
    };
  },
  ["vendors-directory"],
  { revalidate: 120, tags: ["vendors", "campuses"] }
);

export const getCachedCampusesPageData = unstable_cache(
  async () => {
    return prisma.campus.findMany({
      where: { isActive: true },
      take: 30,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        vendors: {
          where: { status: "APPROVED" },
          select: {
            id: true,
            _count: { select: { products: true } },
          },
        },
      },
    });
  },
  ["campuses-directory"],
  { revalidate: 300, tags: ["campuses", "vendors"] }
);

/**
 * Per-request deduplicated lookup for `/product/[slug]` (`generateMetadata` + page).
 */
export const getProductBySlug = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: PRODUCT_DETAIL_SELECT,
  });
  if (!product) return null;
  const [withPromos] = await attachPromotions([product], ["ACTIVE", "SCHEDULED"]);
  return withPromos;
});

export const getCachedRelatedProducts = unstable_cache(
  async (categoryId: string, excludeProductId: string) => {
    const related = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: excludeProductId },
        status: "PUBLISHED",
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: PRODUCT_CARD_SELECT,
    });
    return attachPromotions(related, ["ACTIVE"]);
  },
  ["related-products"],
  { revalidate: 120, tags: ["products"] }
);

/**
 * Per-request deduplicated lookup for `/store/[slug]` (`generateMetadata` + page).
 */
export const getVendorBySlug = cache(async (slug: string) => {
  return prisma.vendorProfile.findUnique({
    where: { slug },
    select: VENDOR_PUBLIC_SELECT,
  });
});

export async function getStorefrontData(vendorId: string, includeNonPublished: boolean, page = 1) {
  const limit = clampLimit(16, 16);
  const safePage = clampPage(page);
  const productWhere = {
    vendorId,
    ...(includeNonPublished ? { status: { not: "HIDDEN" as const } } : { status: "PUBLISHED" as const }),
  };

  const [products, totalProducts, completedOrdersCount, recentReviews] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (safePage - 1) * limit,
      select: PRODUCT_CARD_SELECT,
    }),
    prisma.product.count({ where: productWhere }),
    prisma.order.count({
      where: {
        vendorId,
        status: { in: ["CONFIRMED", "DELIVERED"] },
      },
    }),
    prisma.productReview.findMany({
      where: {
        sellerId: vendorId,
        status: "PUBLISHED",
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        product: { select: { title: true, slug: true } },
        buyer: { select: { fullName: true } },
      },
    }),
  ]);

  const productsWithPromos = await attachPromotions(products, ["ACTIVE"]);

  return {
    products: productsWithPromos,
    totalProducts,
    totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
    page: safePage,
    completedOrdersCount,
    recentReviews,
  };
}
