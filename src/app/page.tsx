import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Flame,
  GraduationCap,
  MapPin,
  Clock,
  CheckCircle,
  Search,
  SlidersHorizontal,
  Layers,
  ThumbsUp,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrustBar } from "@/components/marketplace/TrustBar";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { MobileHeroSlider } from "@/components/marketplace/MobileHeroSlider";
import { DesktopHeroSlider } from "@/components/marketplace/DesktopHeroSlider";
import { DesktopReferenceLayout } from "@/components/marketplace/DesktopReferenceLayout";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { prisma } from "@/lib/prisma";
import { formatNGN } from "@/lib/utils";
import { getCategoryImage, CATEGORY_IMAGES } from "@/lib/category-images";

// Fetch dynamic data from database
async function getHomepageData() {
  try {
    const [categories, campuses, newArrivals, allProducts, featuredProducts, vendors, siteSettings, totalProductCount] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null, isActive: true },
        take: 8,
        include: {
          children: {
            include: {
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
        orderBy: { sortOrder: "asc" },
      }),
      prisma.campus.findMany({
        where: { isActive: true },
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          images: { orderBy: { position: "asc" } },
          category: { select: { name: true, slug: true } },
          vendor: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              whatsapp: true,
              campus: { select: { name: true, slug: true } },
            },
          },
        },
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        take: 36,
        orderBy: { createdAt: "desc" },
        include: {
          images: { orderBy: { position: "asc" } },
          category: { select: { name: true, slug: true } },
          vendor: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              whatsapp: true,
              campus: { select: { name: true, slug: true } },
              sellerType: true,
              verificationTier: true,
              isTrustedSeller: true,
              isRegisteredBusiness: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED", isFeatured: true },
        take: 6,
        include: {
          images: { orderBy: { position: "asc" } },
          category: { select: { name: true, slug: true } },
          vendor: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              whatsapp: true,
              campus: { select: { name: true, slug: true } },
              sellerType: true,
              verificationTier: true,
              isTrustedSeller: true,
              isRegisteredBusiness: true,
            },
          },
        },
      }),
      prisma.vendorProfile.findMany({
        where: { status: "APPROVED" },
        take: 6,
        include: {
          campus: true,
          _count: { select: { products: true } },
        },
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
      }),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
    ]);

    const cmsSettings: Record<string, string> = {};
    (siteSettings || []).forEach((s) => {
      cmsSettings[s.key] = s.value;
    });

    return { categories, campuses, newArrivals, allProducts, featuredProducts, vendors, cmsSettings, totalProductCount };
  } catch (error) {
    console.error("Error loading homepage data:", error);
    return {
      categories: [],
      campuses: [],
      newArrivals: [],
      allProducts: [],
      featuredProducts: [],
      vendors: [],
      cmsSettings: {},
      totalProductCount: 0,
    };
  }
}

export default async function HomePage() {
  const { categories, campuses, newArrivals, allProducts, featuredProducts, vendors, cmsSettings = {}, totalProductCount = 20 } =
    await getHomepageData();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ========================================================= */}
      {/* MOBILE / SMALL SCREENS LAYOUT (Inspired by Reference UI)   */}
      {/* ========================================================= */}
      <div className="lg:hidden bg-neutral-50/50 pb-10 space-y-4">
        {/* 1. Mobile Search Bar & Filter (Ref 1 & 2) */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar placeholder="What are you looking for?" />
            </div>
            <Link
              href="/shop"
              className="w-10 h-10 rounded-2xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-xs hover:border-emerald-500 transition-colors shrink-0"
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
            </Link>
          </div>
        </div>

        {/* 2. Mobile Hero Promo Banner Slider (Interactive Carousel with Shopping Cart) */}
        <div className="px-4">
          <MobileHeroSlider />
        </div>

        {/* 3. Category Filter Chips (Ref 2) */}
        <div className="px-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Link
              href="/shop"
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs shrink-0"
            >
              All
            </Link>
            {categories.slice(0, 6).map((cat: any) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="inline-flex items-center gap-1.5 pl-1.5 pr-3.5 py-1 rounded-full text-xs font-semibold bg-white border border-neutral-200/80 text-neutral-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors shrink-0 shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden relative shrink-0 border border-neutral-200/80 flex items-center justify-center">
                  <Image
                    src={getCategoryImage(cat.slug)}
                    alt={cat.name}
                    fill
                    sizes="20px"
                    className="object-cover object-center"
                  />
                </div>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 4. Categories Visual Grid with Real Contextual Images (Well Centralized) */}
        <div className="px-4 pt-1">
          <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-neutral-900">Categories</h3>
              </div>
              <Link
                href="/shop"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {categories.slice(0, 8).map((cat: any) => {
                const img = getCategoryImage(cat.slug);
                return (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="flex flex-col items-center justify-center group text-center"
                  >
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl overflow-hidden bg-neutral-100 shadow-2xs border border-neutral-200/80 group-hover:border-emerald-500 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                      <Image
                        src={img}
                        alt={cat.name}
                        fill
                        sizes="64px"
                        className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-neutral-950/5 group-hover:bg-transparent transition-colors" />
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-800 group-hover:text-emerald-700 mt-1.5 leading-tight text-center line-clamp-1 w-full px-1">
                      {cat.name.split(" ")[0]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>


        {/* 6. Recommended / Popular Products (Ref 1 & 2) */}
        <div className="px-4 pt-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-neutral-900">Recommended For You</h3>
            </div>
            <Link
              href="/shop?sort=newest"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>See more</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {newArrivals.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        </div>

        {/* 7. Secondary Middle Promo Banner (Ref 2) */}
        <div className="px-4 pt-2">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-4 xs:p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="space-y-1 z-10 max-w-[70%]">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-200">
                  {cmsSettings.flash_sale_badge || "Semester Rush Clearance"}
                </span>
                <h4 className="text-base font-black leading-snug">
                  {cmsSettings.flash_sale_title || "Up To 50% Off Campus Essentials"}
                </h4>
                <p className="text-[10px] text-amber-100">
                  {cmsSettings.flash_sale_subtitle || "Verified deals from graduating students."}
                </p>
              </div>
              <Link
                href="/shop?filter=sale"
                className="w-10 h-10 rounded-full bg-white text-neutral-950 flex items-center justify-center font-bold shadow-md hover:scale-105 active:scale-95 transition-transform z-10 shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 8. Vendor Spotlight Card (Mobile - Bright & Clean Swipeable Layout) */}
        <div className="px-4 pt-1 pb-2">
          <div className="bg-white rounded-3xl p-4 border border-neutral-100 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 leading-tight">Featured Campus Stores</h4>
                  <p className="text-[10px] text-neutral-500">Verified student sellers</p>
                </div>
              </div>
              <Link
                href="/vendors"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Horizontal Scroll of Campus Stores */}
            <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 pt-0.5">
              {vendors.map((v) => (
                <Link
                  key={v.id}
                  href={`/store/${v.slug}`}
                  className="w-[185px] shrink-0 bg-neutral-50/70 hover:bg-emerald-50/30 rounded-2xl p-3 border border-neutral-200/70 hover:border-emerald-300 transition-all flex flex-col justify-between group active:scale-[0.98] shadow-2xs"
                >
                  <div className="space-y-2.5">
                    {/* Header: Store Avatar + Verified Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/80 overflow-hidden shadow-2xs flex items-center justify-center font-bold text-emerald-700 text-sm shrink-0">
                        {v.logo ? (
                          <img src={v.logo} alt={v.storeName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white w-full h-full flex items-center justify-center text-xs font-bold">
                            {v.storeName[0]}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                        Verified
                      </span>
                    </div>

                    {/* Store Name & Campus */}
                    <div>
                      <p className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {v.storeName}
                      </p>
                      <p className="text-[10px] text-neutral-500 flex items-center gap-0.5 line-clamp-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                        {v.campus.name}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Listings Count Pill */}
                  <div className="pt-2.5 mt-2 border-t border-neutral-200/60 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-emerald-700">
                      {v._count.products} {v._count.products === 1 ? "Listing" : "Listings"}
                    </span>
                    <span className="text-neutral-400 group-hover:text-emerald-600 transition-colors font-bold">
                      &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP / LARGE SCREENS LAYOUT (Reference Design Match)    */}
      {/* ========================================================= */}
      <div className="hidden lg:block">
        <DesktopReferenceLayout
          categories={categories as any}
          campuses={campuses as any}
          allProducts={allProducts as any}
          recommendations={
            featuredProducts.length >= 3
              ? (featuredProducts as any)
              : (allProducts.slice(0, 6) as any)
          }
          totalProductCount={totalProductCount || allProducts.length}
        />
      </div>
    </div>
  );
}
