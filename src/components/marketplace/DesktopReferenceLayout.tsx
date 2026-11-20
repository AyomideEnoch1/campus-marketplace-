"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Tag,
  MapPin,
  X,
  Package,
} from "lucide-react";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { getCategoryImage } from "@/lib/category-images";
import { toast } from "sonner";

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  condition?: string;
  isFeatured?: boolean;
  reviewCount?: number;
  avgRating?: number;
  category?: { name: string; slug: string };
  images: { url: string; altText?: string | null }[];
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    whatsapp?: string | null;
    campus?: { id?: string; name: string; slug: string; city?: string } | null;
    sellerType?: string;
    verificationTier?: number;
    isTrustedSeller?: boolean;
    isRegisteredBusiness?: boolean;
  };
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
  children?: { id: string; name: string; slug: string; _count?: { products: number } }[];
}

interface CampusItem {
  id: string;
  name: string;
  slug: string;
}

const HERO_SLIDES = [
  {
    id: "shop",
    title: "Shop",
    subtitle: "Verified Student Marketplace",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1800&q=85",
  },
  {
    id: "explore",
    title: "Explore",
    subtitle: "Hostel Essentials & Campus Tech",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1800&q=85",
  },
  {
    id: "trending",
    title: "Trending",
    subtitle: "Fresh Drops From Fellow Students",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&q=85",
  },
  {
    id: "deals",
    title: "Deals",
    subtitle: "Semester Clearance & Student Discounts",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1800&q=85",
  },
];

interface DesktopReferenceLayoutProps {
  categories: CategoryItem[];
  campuses?: CampusItem[];
  allProducts: ProductItem[];
  recommendations: ProductItem[];
  totalProductCount?: number;
}

export function DesktopReferenceLayout({
  categories = [],
  campuses = [],
  allProducts = [],
  recommendations = [],
  totalProductCount = 20,
}: DesktopReferenceLayoutProps) {
  const router = useRouter();

  // Filters state (mirroring Shop Page capabilities)
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = React.useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = React.useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = React.useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = React.useState<string | null>(null);
  const [selectedSort, setSelectedSort] = React.useState<string>("newest");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeSearch, setActiveSearch] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recommendationIndex, setRecommendationIndex] = React.useState<number>(0);
  const [newsletterEmail, setNewsletterEmail] = React.useState<string>("");
  const [currentSlide, setCurrentSlide] = React.useState<number>(0);
  const [isSliderHovered, setIsSliderHovered] = React.useState<boolean>(false);

  // Auto-play slider (5 seconds interval, pauses on hover)
  React.useEffect(() => {
    if (isSliderHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isSliderHovered]);

  // Count helper identical to shop/page.tsx
  const getCategoryCount = (cat: CategoryItem) =>
    (cat._count?.products || 0) +
    (cat.children?.reduce((acc: number, ch) => acc + (ch._count?.products || 0), 0) || 0);

  // Active filters count
  const activeFiltersCount = [
    selectedCategory !== "all" ? selectedCategory : null,
    selectedSubCategory,
    selectedCampus,
    selectedCondition,
    selectedPriceRange,
    activeSearch ? activeSearch : null,
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSelectedCategory("all");
    setSelectedSubCategory(null);
    setSelectedCampus(null);
    setSelectedCondition(null);
    setSelectedPriceRange(null);
    setSelectedSort("newest");
    setSearchQuery("");
    setActiveSearch("");
    setCurrentPage(1);
  };

  // Filter products based on selected filters
  const filteredProducts = React.useMemo(() => {
    let result = allProducts.filter((product) => {
      // Subcategory filter has highest priority if set
      if (selectedSubCategory) {
        if (product.category?.slug !== selectedSubCategory) return false;
      } else if (selectedCategory !== "all") {
        const cat = categories.find((c) => c.slug === selectedCategory);
        const childSlugs = cat?.children?.map((ch) => ch.slug) || [];
        const allowedSlugs = [selectedCategory, ...childSlugs];
        if (!product.category?.slug || !allowedSlugs.includes(product.category.slug)) {
          return false;
        }
      }

      // Campus filter
      if (selectedCampus) {
        if (product.vendor.campus?.slug !== selectedCampus) return false;
      }

      // Condition filter
      if (selectedCondition) {
        if (product.condition !== selectedCondition) return false;
      }

      // Price Range filter
      if (selectedPriceRange === "under-10k" && product.price >= 10000) return false;
      if (selectedPriceRange === "10k-30k" && (product.price < 10000 || product.price > 30000)) return false;
      if (selectedPriceRange === "30k-100k" && (product.price < 30000 || product.price > 100000)) return false;
      if (selectedPriceRange === "over-100k" && product.price <= 100000) return false;

      // Search filter
      if (activeSearch.trim()) {
        const q = activeSearch.toLowerCase().trim();
        const matchesTitle = product.title.toLowerCase().includes(q);
        const matchesCat = product.category?.name.toLowerCase().includes(q);
        const matchesVendor = product.vendor?.storeName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesVendor) return false;
      }

      return true;
    });

    // Sorting
    if (selectedSort === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (selectedSort === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [
    allProducts,
    categories,
    selectedCategory,
    selectedSubCategory,
    selectedCampus,
    selectedCondition,
    selectedPriceRange,
    selectedSort,
    activeSearch,
  ]);

  // Pagination (6 items per page for a balanced 3x2 grid matching reference)
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid campus email address.");
      return;
    }
    toast.success("Subscribed! You'll receive student discount alerts.");
    setNewsletterEmail("");
  };

  // Recommendations sliding (3 per view)
  const recommendationSlice = recommendations.slice(
    recommendationIndex,
    recommendationIndex + 3
  );

  const handlePrevRecommendation = () => {
    setRecommendationIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextRecommendation = () => {
    if (recommendationIndex + 3 < recommendations.length) {
      setRecommendationIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-[#fcfcfc] text-neutral-900 pb-16">
      {/* ======================================================== */}
      {/* 1. HERO BANNER SLIDER (WITHOUT NAVIGATION ARROWS)        */}
      {/* ======================================================== */}
      <div
        className="relative w-full h-[340px] lg:h-[360px] overflow-hidden bg-neutral-900 select-none"
        onMouseEnter={() => setIsSliderHovered(true)}
        onMouseLeave={() => setIsSliderHovered(false)}
      >
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={idx === 0}
                sizes="100vw"
                className="object-cover object-center brightness-[0.74] contrast-[1.05]"
              />

              {/* Ambient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/65 pointer-events-none" />

              {/* Giant Centered Display Typography */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <h1 className="text-white text-[110px] lg:text-[145px] font-black tracking-tight leading-none drop-shadow-md opacity-95">
                  {slide.title}
                </h1>
                <p className="text-white/80 text-xs lg:text-sm font-semibold tracking-widest uppercase mt-2 drop-shadow-sm">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          );
        })}

        {/* Minimal Bottom Indicators (No Navigation Arrows) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? "w-8 bg-emerald-500 shadow-sm"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. "Give All You Need" SECTION (POSITIONED UNDER BANNER) */}
      {/* ======================================================== */}
      <div className="w-[85%] min-w-[70%] max-w-7xl mx-auto pt-8">
        <div className="bg-white rounded-3xl p-4 lg:p-6">
          {/* Header Row: "Give All You Need" + Integrated Search */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-100 gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-neutral-900 tracking-tight">
                Give All You Need
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Verified student goods, hostel essentials, textbooks, and campus gear directly from student vendors
              </p>
            </div>

            {/* Integrated Pill Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full justify-end">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search on ọjà..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-full text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveSearch("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors shrink-0 shadow-xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* Category Pill Slider (Exact Match to Shop Page) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4 border-b border-neutral-100">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSubCategory(null);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === "all" && !selectedSubCategory
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 hover:text-neutral-900"
              }`}
            >
              All Items ({allProducts.length})
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    setSelectedSubCategory(null);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
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
                  <span className={`text-[10px] ${isSelected ? "text-emerald-100 font-bold" : "text-neutral-400"}`}>
                    ({getCategoryCount(cat)})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Catalog Layout: 2 Columns (Sidebar + 3-Column Grid) */}
          <div className="grid grid-cols-12 gap-8 pt-8">
            {/* ---------------------------------------------------- */}
            {/* LEFT SIDEBAR: Categories & Filters (Shop Page Design) */}
            {/* ---------------------------------------------------- */}
            <aside className="col-span-3 space-y-6 pr-2">
              <div className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50/70 sticky top-28 space-y-6">
                {/* Filter Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60">
                  <span className="font-extrabold text-sm uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Categories List (Exact Match to Shop Page) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                    Categories
                  </label>
                  <div className="space-y-1 max-h-64 overflow-y-auto text-xs pr-1">
                    {/* All Categories Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        setSelectedSubCategory(null);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl transition-colors w-full text-left ${
                        selectedCategory === "all" && !selectedSubCategory
                          ? "bg-emerald-50 text-emerald-800 font-bold"
                          : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-600" />
                        All Categories
                      </span>
                      <span className="text-[10px] text-neutral-400 font-semibold bg-neutral-100 px-1.5 py-0.5 rounded-md">
                        {allProducts.length}
                      </span>
                    </button>

                    {/* Category Items with Photo Thumbnails & Expandable Subcategories */}
                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat.slug;
                      return (
                        <div key={cat.id} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.slug);
                              setSelectedSubCategory(null);
                              setCurrentPage(1);
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl transition-colors w-full text-left ${
                              isSelected
                                ? "bg-emerald-50 text-emerald-800 font-bold"
                                : "text-neutral-600 hover:bg-neutral-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-md overflow-hidden relative shrink-0 border border-neutral-200/80 flex items-center justify-center">
                                <Image
                                  src={getCategoryImage(cat.slug)}
                                  alt={cat.name}
                                  fill
                                  sizes="20px"
                                  className="object-cover object-center"
                                />
                              </div>
                              <span className="truncate">{cat.name}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                              {getCategoryCount(cat)}
                            </span>
                          </button>

                          {/* Subcategories (if active) */}
                          {isSelected && cat.children && cat.children.length > 0 && (
                            <div className="pl-3 ml-2 border-l-2 border-emerald-500/30 space-y-0.5 py-1">
                              {cat.children.map((sub) => {
                                const isSubSelected = selectedSubCategory === sub.slug;
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedSubCategory(isSubSelected ? null : sub.slug);
                                      setCurrentPage(1);
                                    }}
                                    className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] transition-colors w-full text-left ${
                                      isSubSelected
                                        ? "bg-emerald-100/70 text-emerald-900 font-bold"
                                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                    }`}
                                  >
                                    <span className="truncate">{sub.name}</span>
                                    <span className="text-[9px] text-neutral-400">
                                      {sub._count?.products || 0}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Campus Location Filter */}
                {campuses.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                    <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                      Campus Location
                    </label>
                    <div className="space-y-1 max-h-36 overflow-y-auto text-xs pr-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCampus(null);
                          setCurrentPage(1);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl transition-colors w-full text-left ${
                          !selectedCampus
                            ? "bg-emerald-50 text-emerald-800 font-bold"
                            : "text-neutral-600 hover:bg-neutral-100"
                        }`}
                      >
                        <span>All Campuses</span>
                      </button>
                      {campuses.map((c) => {
                        const isSelected = selectedCampus === c.slug;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCampus(isSelected ? null : c.slug);
                              setCurrentPage(1);
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl transition-colors w-full text-left ${
                              isSelected
                                ? "bg-emerald-50 text-emerald-800 font-bold"
                                : "text-neutral-600 hover:bg-neutral-100"
                            }`}
                          >
                            <span className="truncate">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Condition Filter */}
                <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                    Condition
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "All", value: null },
                      { label: "New", value: "NEW" },
                      { label: "Like New", value: "USED_LIKE_NEW" },
                      { label: "Good", value: "USED_GOOD" },
                    ].map((cond) => {
                      const isSelected = selectedCondition === cond.value;
                      return (
                        <button
                          key={cond.label}
                          type="button"
                          onClick={() => {
                            setSelectedCondition(cond.value);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-500 text-white font-bold shadow-xs"
                              : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                          }`}
                        >
                          {cond.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="space-y-2 pt-2 border-t border-neutral-200/60">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                    Price Filter (₦)
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Under ₦10k", value: "under-10k" },
                      { label: "₦10k - ₦30k", value: "10k-30k" },
                      { label: "₦30k - ₦100k", value: "30k-100k" },
                      { label: "Over ₦100k", value: "over-100k" },
                    ].map((p) => {
                      const isSelected = selectedPriceRange === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => {
                            setSelectedPriceRange(isSelected ? null : p.value);
                            setCurrentPage(1);
                          }}
                          className={`p-2 text-center rounded-xl transition-colors ${
                            isSelected
                              ? "bg-emerald-600 text-white font-bold shadow-xs"
                              : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: Products Header + Grid (Shop Page)     */}
            {/* ---------------------------------------------------- */}
            <main className="col-span-9 flex flex-col justify-between">
              <div>
                {/* Header: Found count + Sorting dropdown */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-neutral-900">
                      {activeSearch
                        ? `Search results for "${activeSearch}"`
                        : selectedSubCategory
                        ? categories
                            .flatMap((c) => c.children || [])
                            .find((sub) => sub.slug === selectedSubCategory)?.name || "Products"
                        : selectedCategory !== "all"
                        ? categories.find((c) => c.slug === selectedCategory)?.name || "Category Items"
                        : "All Campus Items"}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Found: <span className="font-bold text-neutral-800">{filteredProducts.length}</span>{" "}
                      active listings
                      {selectedCampus && ` at ${campuses.find((c) => c.slug === selectedCampus)?.name}`}
                    </p>
                  </div>

                  {/* Sorting Bar */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-500 font-medium">Sort by:</span>
                    <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full">
                      {[
                        { label: "Newest", value: "newest" },
                        { label: "Price Low-High", value: "price-asc" },
                        { label: "Price High-Low", value: "price-desc" },
                      ].map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSelectedSort(s.value)}
                          className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                            selectedSort === s.value
                              ? "bg-white text-neutral-900 shadow-xs font-bold"
                              : "text-neutral-600 hover:text-neutral-900"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                {currentProducts.length === 0 ? (
                  <div className="py-20 text-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/50 p-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                      🔍
                    </div>
                    <h4 className="text-lg font-bold text-neutral-800">
                      No products found
                    </h4>
                    <p className="text-sm text-neutral-500 max-w-md mx-auto">
                      Try broadening your search, resetting active filters, or switching campus locations.
                    </p>
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs transition-colors shadow-xs"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  /* 3-Column Product Grid using EXACT ProductCard component from the Shop Page */
                  <div className="grid grid-cols-3 gap-6">
                    {currentProducts.map((product) => (
                      <ProductCard key={product.id} product={product as any} />
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-10 mt-6 border-t border-neutral-100 text-xs font-semibold text-neutral-600">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 hover:text-emerald-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isActive
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-neutral-500 hover:bg-emerald-50 hover:text-emerald-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 hover:text-emerald-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. EXPLORE OUR RECOMMENDATIONS CAROUSEL / ROW            */}
        {/* ======================================================== */}
        {recommendations.length > 0 && (
          <div className="pt-14 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
                  Explore our recomendations
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Hand-picked student listings and top trending gear across campus
                </p>
              </div>

              {/* Slider Arrow Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={recommendationIndex === 0}
                  onClick={handlePrevRecommendation}
                  className="w-9 h-9 rounded-full border border-neutral-300 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs disabled:opacity-30 disabled:pointer-events-none"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={recommendationIndex + 3 >= recommendations.length}
                  onClick={handleNextRecommendation}
                  className="w-9 h-9 rounded-full border border-neutral-300 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs disabled:opacity-30 disabled:pointer-events-none"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Row of Recommendation Cards using Shop Page ProductCard */}
            <div className="grid grid-cols-3 gap-6">
              {recommendationSlice.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. READY TO GET OUR NEW STUFF? BOTTOM CTA BANNER         */}
        {/* ======================================================== */}
        <div className="mt-14 rounded-[32px] bg-gradient-to-tr from-neutral-950 via-neutral-900 to-emerald-950 text-white p-8 lg:p-12 shadow-xl border border-emerald-900/40 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Headline & Email Input */}
          <div className="space-y-4 max-w-md w-full">
            <h3 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Ready to Get<br />Our New Stuff?
            </h3>

            {/* Email Pill Input */}
            <form onSubmit={handleNewsletterSubmit} className="flex items-center bg-white rounded-full p-1.5 shadow-md">
              <input
                type="email"
                placeholder="Enter your campus email..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full pl-4 pr-2 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2 rounded-full transition-colors shrink-0 shadow-xs"
              >
                Send
              </button>
            </form>
          </div>

          {/* Right: Description & Platform Info */}
          <div className="max-w-md space-y-2 text-right md:text-left">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              ọjà for Students &amp; Campus Needs
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed">
              We listen to student needs, connect you with verified sellers on your campus, and protect every single order with instant escrow release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
