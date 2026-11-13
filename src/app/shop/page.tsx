import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { SlidersHorizontal, ArrowUpDown, X, RotateCcw, MapPin, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCategoryImage } from "@/lib/category-images";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustBar } from "@/components/marketplace/TrustBar";
import { MobileShopFilters } from "@/components/marketplace/MobileShopFilters";
import { SearchBar } from "@/components/marketplace/SearchBar";

interface ShopPageProps {
  searchParams: {
    campus?: string;
    category?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    q?: string;
    vendor?: string;
    sellerType?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { campus, category, condition, minPrice, maxPrice, sort, q, vendor, sellerType } = searchParams;

  // Build Prisma where filter
  const where: any = {
    status: "PUBLISHED",
  };

  if (category) {
    const matchedCategory = await prisma.category.findUnique({
      where: { slug: category },
      include: { children: true },
    });

    if (matchedCategory && matchedCategory.children?.length > 0) {
      where.category = {
        slug: { in: [matchedCategory.slug, ...matchedCategory.children.map((c) => c.slug)] },
      };
    } else {
      where.category = {
        slug: category,
      };
    }
  }

  if (campus) {
    where.vendor = {
      campus: {
        slug: campus,
      },
    };
  }

  if (vendor) {
    where.vendor = {
      ...(where.vendor || {}),
      slug: vendor,
    };
  }

  if (sellerType && (sellerType === "student" || sellerType === "guest")) {
    where.vendor = {
      ...(where.vendor || {}),
      sellerType,
    };
  }

  if (condition) {
    where.condition = condition;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  const rawQ = q?.trim() || "";
  if (rawQ) {
    where.OR = [
      { title: { contains: rawQ } },
      { description: { contains: rawQ } },
      { tags: { contains: rawQ } },
      { category: { name: { contains: rawQ } } },
    ];
  }

  // Determine sorting
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  if (sort === "price-desc") orderBy = { price: "desc" };
  if (sort === "popular") orderBy = { viewsCount: "desc" };

  // Fetch products, categories, campuses, and vendors
  const [products, categories, campuses, vendors] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        images: { orderBy: { position: "asc" } },
        category: { select: { name: true, slug: true } },
        vendor: {
          select: {
            storeName: true,
            slug: true,
            whatsapp: true,
            sellerType: true,
            isRegisteredBusiness: true,
            isTrustedSeller: true,
            campus: { select: { name: true, slug: true } },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
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
    prisma.vendorProfile.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        storeName: true,
        slug: true,
        campus: { select: { name: true, slug: true } },
        _count: { select: { products: true } },
      },
      orderBy: { storeName: "asc" },
    }),
  ]);

  const activeFiltersCount = [campus, category, condition, minPrice, maxPrice, q, vendor, sellerType].filter(
    Boolean
  ).length;

  const getCategoryCount = (cat: any) =>
    (cat._count?.products || 0) +
    (cat.children?.reduce((acc: number, ch: any) => acc + (ch._count?.products || 0), 0) || 0);

  return (
    <div className="bg-white min-h-screen">
      {/* 1. TOP HERO HEADER (Desktop/Tablet only) */}
      <section className="hidden md:block bg-gradient-to-b from-emerald-50/80 via-emerald-50/30 to-white text-neutral-950 py-8 sm:py-12 px-4 border-b border-neutral-100">
        <div className="container mx-auto">
          <div className="max-w-3xl space-y-2.5 sm:space-y-3">
            <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200/80 text-xs font-semibold uppercase tracking-wider shadow-2xs inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              Student Marketplace Catalog
            </Badge>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950">
              Explore Campus Drops &amp; Goods
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed">
              Browse textbooks, tech, hostel living gear, and thrift fashion directly from fellow students. Filter by campus or search for what you need.
            </p>

            {/* Search Input Bar */}
            <div className="pt-1.5 sm:pt-2 max-w-xl">
              <SearchBar
                defaultValue={rawQ}
                placeholder="Search textbooks, smartphones, sneakers..."
                className="w-full shadow-xs"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Top Search Bar (Compact, visible only on small screens) */}
      <div className="md:hidden px-4 pt-3 pb-1 bg-white">
        <SearchBar
          defaultValue={rawQ}
          placeholder="Search campus drops & goods..."
          size="sm"
          className="w-full shadow-xs"
        />
      </div>

      {/* 2. HORIZONTAL CATEGORY PILL SLIDER & MOBILE FILTERS */}
      <div className="border-b border-neutral-100 bg-white sticky top-16 md:top-20 z-20 py-2.5 sm:py-3 shadow-xs">
        <div className="container mx-auto px-4 space-y-2">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Link
              href="/shop"
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                !category
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 hover:text-neutral-900"
              }`}
            >
              All Items ({products.length})
            </Link>
            {categories.map((cat: any) => {
              const isSelected = category === cat.slug;
              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}${campus ? `&campus=${campus}` : ""}`}
                  className={`inline-flex items-center gap-1.5 pl-1.5 pr-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 hover:text-neutral-900"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden relative shrink-0 border border-white/60 flex items-center justify-center">
                    <Image
                      src={getCategoryImage(cat.slug)}
                      alt={cat.name}
                      fill
                      sizes="20px"
                      className="object-cover object-center"
                    />
                  </div>
                  <span>{cat.name}</span>
                  <span className={`text-[10px] ${isSelected ? "text-emerald-100" : "text-neutral-400"}`}>
                    ({getCategoryCount(cat)})
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Quick Filters & Bottom Sheet Trigger (Campuses, Price, Condition, Sort, Vendors) */}
          <MobileShopFilters
            campuses={campuses}
            vendors={vendors}
            totalProductsCount={products.length}
          />
        </div>
      </div>

      {/* 3. MAIN CATALOG WITH SIDEBAR FILTERS (Reference Image 1 Layout) */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Filter Panel */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/60 sticky top-36 space-y-6">
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60">
                <span className="font-extrabold text-sm uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </span>
                {activeFiltersCount > 0 && (
                  <Link
                    href="/shop"
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Link>
                )}
              </div>

              {/* Campus Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Campus Location
                </label>
                <div className="space-y-1 text-xs">
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(category ? { category } : {}),
                      ...(condition ? { condition } : {}),
                      ...(vendor ? { vendor } : {}),
                    }).toString()}`}
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      !campus
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <span>All Campuses</span>
                  </Link>
                  {campuses.map((c) => {
                    const isSelected = campus === c.slug;
                    return (
                      <Link
                        key={c.id}
                        href={`/shop?${new URLSearchParams({
                          campus: c.slug,
                          ...(category ? { category } : {}),
                          ...(condition ? { condition } : {}),
                          ...(vendor ? { vendor } : {}),
                        }).toString()}`}
                        className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-800 font-bold"
                            : "text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Vendors / Student Stores Filter */}
              <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Student Vendors</span>
                  <span className="text-[10px] text-neutral-400 font-normal">({vendors.length})</span>
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(campus ? { campus } : {}),
                      ...(category ? { category } : {}),
                      ...(condition ? { condition } : {}),
                      ...(minPrice ? { minPrice } : {}),
                      ...(maxPrice ? { maxPrice } : {}),
                      ...(sort ? { sort } : {}),
                    }).toString()}`}
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      !vendor
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <span>All Vendors</span>
                  </Link>
                  {vendors.map((v) => {
                    const isSelected = vendor === v.slug;
                    return (
                      <Link
                        key={v.id}
                        href={`/shop?${new URLSearchParams({
                          ...(campus ? { campus } : {}),
                          ...(category ? { category } : {}),
                          ...(condition ? { condition } : {}),
                          ...(minPrice ? { minPrice } : {}),
                          ...(maxPrice ? { maxPrice } : {}),
                          ...(sort ? { sort } : {}),
                          vendor: v.slug,
                        }).toString()}`}
                        className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-800 font-bold"
                            : "text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block truncate font-medium">{v.storeName}</span>
                          <span className="text-[10px] text-neutral-400 block truncate">
                            {v.campus?.name.split(" ")[0]}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 shrink-0 font-semibold bg-neutral-100 px-1.5 py-0.5 rounded-md">
                          {v._count.products}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Categories Filter */}
              <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Categories
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                  {categories.map((c: any) => {
                    const isSelected =
                      category === c.slug || c.children?.some((ch: any) => ch.slug === category);
                    return (
                      <div key={c.id} className="space-y-0.5">
                        <Link
                          href={`/shop?${new URLSearchParams({
                            category: c.slug,
                            ...(campus ? { campus } : {}),
                            ...(vendor ? { vendor } : {}),
                            ...(condition ? { condition } : {}),
                          }).toString()}`}
                          className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                            category === c.slug
                              ? "bg-emerald-50 text-emerald-800 font-bold"
                              : isSelected
                              ? "text-emerald-800 font-semibold bg-emerald-50/50"
                              : "text-neutral-600 hover:bg-neutral-100"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-md overflow-hidden relative shrink-0 border border-neutral-200/80 flex items-center justify-center">
                              <Image
                                src={getCategoryImage(c.slug)}
                                alt={c.name}
                                fill
                                sizes="20px"
                                className="object-cover object-center"
                              />
                            </div>
                            <span className="truncate">{c.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                            {getCategoryCount(c)}
                          </span>
                        </Link>

                        {isSelected && c.children && c.children.length > 0 && (
                          <div className="pl-3 ml-2 border-l-2 border-emerald-500/30 space-y-0.5 py-1">
                            {c.children.map((sub: any) => {
                              const isSubSelected = category === sub.slug;
                              return (
                                <Link
                                  key={sub.id}
                                  href={`/shop?${new URLSearchParams({
                                    category: sub.slug,
                                    ...(campus ? { campus } : {}),
                                    ...(vendor ? { vendor } : {}),
                                    ...(condition ? { condition } : {}),
                                  }).toString()}`}
                                  className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] transition-colors ${
                                    isSubSelected
                                      ? "bg-emerald-100/70 text-emerald-900 font-bold"
                                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                  }`}
                                >
                                  <span>{sub.name}</span>
                                  <span className="text-[9px] text-neutral-400">
                                    {sub._count?.products || 0}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seller Type Filter */}
              <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Seller Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "All Sellers", value: "" },
                    { label: "Student Vendors", value: "student" },
                    { label: "Guest Vendors", value: "guest" },
                  ].map((st) => {
                    const isSelected = (sellerType || "") === st.value;
                    return (
                      <Link
                        key={st.value}
                        href={`/shop?${new URLSearchParams({
                          ...(campus ? { campus } : {}),
                          ...(category ? { category } : {}),
                          ...(condition ? { condition } : {}),
                          ...(sort ? { sort } : {}),
                          ...(q ? { q } : {}),
                          ...(vendor ? { vendor } : {}),
                          ...(st.value ? { sellerType: st.value } : {}),
                        }).toString()}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-emerald-500 text-white font-bold shadow-xs"
                            : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        {st.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Condition Filter */}
              <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Condition
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "New", value: "NEW" },
                    { label: "Like New", value: "USED_LIKE_NEW" },
                    { label: "Good", value: "USED_GOOD" },
                    { label: "Fair", value: "USED_FAIR" },
                  ].map((cond) => {
                    const isSelected = condition === cond.value;
                    return (
                      <Link
                        key={cond.value}
                        href={`/shop?${new URLSearchParams({
                          ...(campus ? { campus } : {}),
                          ...(vendor ? { vendor } : {}),
                          ...(category ? { category } : {}),
                          condition: cond.value,
                        }).toString()}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-emerald-500 text-white font-bold shadow-xs"
                            : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        {cond.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Price Filter (₦)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(campus ? { campus } : {}),
                      ...(category ? { category } : {}),
                      maxPrice: "10000",
                    }).toString()}`}
                    className="p-2 text-center rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100"
                  >
                    Under ₦10k
                  </Link>
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(campus ? { campus } : {}),
                      ...(category ? { category } : {}),
                      minPrice: "10000",
                      maxPrice: "30000",
                    }).toString()}`}
                    className="p-2 text-center rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100"
                  >
                    ₦10k - ₦30k
                  </Link>
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(campus ? { campus } : {}),
                      ...(category ? { category } : {}),
                      minPrice: "30000",
                      maxPrice: "100000",
                    }).toString()}`}
                    className="p-2 text-center rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100"
                  >
                    ₦30k - ₦100k
                  </Link>
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(campus ? { campus } : {}),
                      ...(category ? { category } : {}),
                      minPrice: "100000",
                    }).toString()}`}
                    className="p-2 text-center rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100"
                  >
                    Over ₦100k
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Header: Found count + Sorting dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                  {rawQ
                    ? `Search results for "${rawQ}"`
                    : category
                    ? categories.find((c) => c.slug === category)?.name || "Category Items"
                    : "All Campus Items"}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Found: <span className="font-bold text-neutral-800">{products.length}</span>{" "}
                  active listings
                  {campus && ` at ${campuses.find((c) => c.slug === campus)?.name || campus}`}
                </p>
              </div>

              {/* Sorting Bar */}
              <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                <span className="text-neutral-500 font-medium hidden sm:inline">Sort by:</span>
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full">
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(campus ? { campus } : {}),
                      ...(category ? { category } : {}),
                      ...(condition ? { condition } : {}),
                      sort: "newest",
                    }).toString()}`}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                      !sort || sort === "newest"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Newest
                  </Link>
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(campus ? { campus } : {}),
                      ...(category ? { category } : {}),
                      ...(condition ? { condition } : {}),
                      sort: "price-asc",
                    }).toString()}`}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                      sort === "price-asc"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Price Low-High
                  </Link>
                  <Link
                    href={`/shop?${new URLSearchParams({
                      ...(campus ? { campus } : {}),
                      ...(category ? { category } : {}),
                      ...(condition ? { condition } : {}),
                      sort: "price-desc",
                    }).toString()}`}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                      sort === "price-desc"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Price High-Low
                  </Link>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs text-neutral-400 font-medium">Active:</span>
                {campus && (
                  <Badge variant="campus" className="gap-1 py-1 px-2.5 text-[11px] sm:text-xs shrink-0 max-w-full">
                    <span className="truncate">Campus: {campuses.find((c) => c.slug === campus)?.name.split(" ")[0]}</span>
                    <Link
                      href={`/shop?${new URLSearchParams({
                        ...(category ? { category } : {}),
                        ...(condition ? { condition } : {}),
                        ...(vendor ? { vendor } : {}),
                      }).toString()}`}
                      className="shrink-0"
                    >
                      <X className="w-3 h-3 hover:text-rose-600" />
                    </Link>
                  </Badge>
                )}
                {vendor && (
                  <Badge variant="secondary" className="gap-1 py-1 px-2.5 text-[11px] sm:text-xs font-bold shrink-0 max-w-full">
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">Vendor: {vendors.find((v) => v.slug === vendor)?.storeName || vendor}</span>
                    <Link
                      href={`/shop?${new URLSearchParams({
                        ...(campus ? { campus } : {}),
                        ...(category ? { category } : {}),
                        ...(condition ? { condition } : {}),
                      }).toString()}`}
                      className="shrink-0"
                    >
                      <X className="w-3 h-3 hover:text-rose-600" />
                    </Link>
                  </Badge>
                )}
                {category && (
                  <Badge variant="secondary" className="gap-1 py-1 px-2.5 text-[11px] sm:text-xs shrink-0 max-w-full">
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">
                      Category: {
                        categories.find((c: any) => c.slug === category)?.name ||
                        categories.flatMap((c: any) => c.children || []).find((sub: any) => sub.slug === category)?.name ||
                        category
                      }
                    </span>
                    <Link
                      href={`/shop?${new URLSearchParams({
                        ...(campus ? { campus } : {}),
                        ...(condition ? { condition } : {}),
                        ...(vendor ? { vendor } : {}),
                      }).toString()}`}
                      className="shrink-0"
                    >
                      <X className="w-3 h-3 hover:text-rose-600" />
                    </Link>
                  </Badge>
                )}
                {condition && (
                  <Badge variant="secondary" className="gap-1 py-1 px-2.5 text-[11px] sm:text-xs shrink-0 max-w-full">
                    <span className="truncate">Condition: {condition}</span>
                    <Link
                      href={`/shop?${new URLSearchParams({
                        ...(campus ? { campus } : {}),
                        ...(category ? { category } : {}),
                        ...(vendor ? { vendor } : {}),
                      }).toString()}`}
                      className="shrink-0"
                    >
                      <X className="w-3 h-3 hover:text-rose-600" />
                    </Link>
                  </Badge>
                )}
                <Link
                  href="/shop"
                  className="text-xs font-semibold text-rose-600 hover:underline ml-2"
                >
                  Clear all filters
                </Link>
              </div>
            )}

            {/* Product Grid (Matching Reference Image 1) */}
            {products.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/50 p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-neutral-800">
                  {rawQ ? `No products found matching "${rawQ}"` : "No products match your filters"}
                </h3>
                <p className="text-sm text-neutral-500 max-w-md mx-auto">
                  {rawQ
                    ? "Try checking your spelling, using more generic keywords (e.g. 'shoes', 'iphone', 'textbook'), or clearing your search."
                    : "Try broadening your search, resetting active filters, or switching campus locations."}
                </p>
                <Link href="/shop">
                  <Button variant="default" size="sm" className="mt-2 rounded-full">
                    {rawQ ? "Clear Search & View All" : "Reset All Filters"}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Trust bar at bottom */}
      <TrustBar />
    </div>
  );
}
