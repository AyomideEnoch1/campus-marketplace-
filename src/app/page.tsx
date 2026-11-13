import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Flame,
  Star,
  GraduationCap,
  MapPin,
  Clock,
  CheckCircle,
  Search,
  SlidersHorizontal,
  Layers,
  ThumbsUp,
  ShieldCheck,
  Zap,
  Truck,
  Headphones,
  Store,
  Shirt,
  Laptop,
  Home as HomeIcon,
  BookOpen,
  Utensils,
  Dumbbell,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrustBar } from "@/components/marketplace/TrustBar";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { prisma } from "@/lib/prisma";
import { formatNGN } from "@/lib/utils";

// Fetch dynamic data from database
async function getHomepageData() {
  try {
    const [categories, campuses, newArrivals, featuredProducts, vendors] = await Promise.all([
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
              storeName: true,
              slug: true,
              whatsapp: true,
              campus: { select: { name: true, slug: true } },
            },
          },
        },
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED", isFeatured: true },
        take: 3,
        include: {
          images: { orderBy: { position: "asc" } },
          vendor: {
            select: {
              storeName: true,
              slug: true,
              campus: { select: { name: true, slug: true } },
            },
          },
        },
      }),
      prisma.vendorProfile.findMany({
        where: { status: "APPROVED" },
        take: 4,
        include: {
          campus: true,
          _count: { select: { products: true } },
        },
      }),
    ]);

    return { categories, campuses, newArrivals, featuredProducts, vendors };
  } catch (error) {
    console.error("Error loading homepage data:", error);
    return { categories: [], campuses: [], newArrivals: [], featuredProducts: [], vendors: [] };
  }
}

function getCategoryIcon(slug: string) {
  switch (slug) {
    case "fashion":
      return Shirt;
    case "electronics":
      return Laptop;
    case "hostel-essentials":
      return HomeIcon;
    case "books-academics":
      return BookOpen;
    case "beauty-care":
      return Sparkles;
    case "food-groceries":
      return Utensils;
    case "sports-fitness":
      return Dumbbell;
    case "services":
    default:
      return Briefcase;
  }
}

const categoryPastels: Record<string, { bg: string; text: string }> = {
  fashion: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
  electronics: { bg: "bg-blue-50 border-blue-100", text: "text-blue-700" },
  "hostel-essentials": { bg: "bg-amber-50 border-amber-100", text: "text-amber-700" },
  "books-academics": { bg: "bg-purple-50 border-purple-100", text: "text-purple-700" },
  "beauty-care": { bg: "bg-pink-50 border-pink-100", text: "text-pink-700" },
  "food-groceries": { bg: "bg-orange-50 border-orange-100", text: "text-orange-700" },
  "sports-fitness": { bg: "bg-teal-50 border-teal-100", text: "text-teal-700" },
  services: { bg: "bg-rose-50 border-rose-100", text: "text-rose-700" },
};

export default async function HomePage() {
  const { categories, campuses, newArrivals, featuredProducts, vendors } =
    await getHomepageData();

  const categoryImages: Record<string, string> = {
    fashion: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80",
    electronics: "https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=600&q=80",
    "hostel-essentials": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80",
    "books-academics": "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80",
    "beauty-care": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80",
    "food-groceries": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
    "sports-fitness": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80",
    services: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&q=80",
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ========================================================= */}
      {/* MOBILE / SMALL SCREENS LAYOUT (Inspired by Reference UI)   */}
      {/* ========================================================= */}
      <div className="lg:hidden bg-neutral-50/50 pb-10 space-y-4">
        {/* 1. Mobile Search Bar & Filter (Ref 1 & 2) */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="flex-1 flex items-center gap-2.5 bg-white border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs text-neutral-400 shadow-xs hover:border-emerald-500 transition-colors"
            >
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="truncate">What are you looking for?</span>
            </Link>
            <Link
              href="/shop"
              className="w-10 h-10 rounded-2xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-xs hover:border-emerald-500 transition-colors shrink-0"
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
            </Link>
          </div>
        </div>

        {/* 2. Mobile Hero Promo Banner Card (Ref 1 & 2) */}
        <div className="px-4">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 p-4 xs:p-5 text-white shadow-lg shadow-emerald-600/20">
            {/* Background subtle curve */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              {/* Left Column Text */}
              <div className="w-[62%] space-y-2 pr-1">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-200">
                  <Flame className="w-3 h-3 text-amber-300" />
                  Best Seller!
                </span>
                <h2 className="text-lg xs:text-xl font-black leading-tight tracking-tight text-white">
                  Discover Campus <br />
                  <span className="text-amber-300">Products!</span>
                </h2>
                <p className="text-[11px] text-emerald-100 line-clamp-2 leading-relaxed font-normal">
                  Buy &amp; sell textbooks, drip &amp; gadgets from verified peers.
                </p>
                <div className="pt-1">
                  <Link href="/shop">
                    <Button size="sm" className="bg-white text-emerald-950 hover:bg-neutral-100 font-bold text-xs px-4 py-1.5 h-8 rounded-full shadow-md active:scale-95 transition-all">
                      Shop Now!
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column 3D Visual */}
              <div className="w-[38%] h-32 xs:h-36 relative flex items-center justify-center shrink-0">
                <Image
                  src="/images/hero-shopping-items-transparent.png"
                  alt="Student campus shopping items"
                  fill
                  priority
                  sizes="160px"
                  className="object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.22)]"
                />
              </div>
            </div>
          </div>
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
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-neutral-200/80 text-neutral-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors shrink-0 shadow-2xs"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* 4. Categories Icon Grid (Ref 1) */}
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

            <div className="grid grid-cols-4 gap-3">
              {categories.slice(0, 8).map((cat: any) => {
                const IconComponent = getCategoryIcon(cat.slug);
                const colors = categoryPastels[cat.slug] || {
                  bg: "bg-emerald-50 border-emerald-100",
                  text: "text-emerald-700",
                };
                return (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="flex flex-col items-center group text-center"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl ${colors.bg} border flex items-center justify-center transition-all shadow-2xs group-hover:scale-105`}
                    >
                      <IconComponent className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-700 group-hover:text-emerald-700 mt-1.5 line-clamp-1">
                      {cat.name.split(" ")[0]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Trust Guarantee Micro-Pills (Mobile) */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-2xl p-2.5 border border-neutral-100 flex items-center gap-2 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-neutral-900 truncate">100% Student ID</p>
                <p className="text-[9px] text-neutral-500 truncate">Verified Vendors</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-2.5 border border-neutral-100 flex items-center gap-2 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-neutral-900 truncate">Secure Escrow</p>
                <p className="text-[9px] text-neutral-500 truncate">Safe Payments</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-2.5 border border-neutral-100 flex items-center gap-2 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-neutral-900 truncate">Campus Pickup</p>
                <p className="text-[9px] text-neutral-500 truncate">Fast Hand-off</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-2.5 border border-neutral-100 flex items-center gap-2 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-neutral-900 truncate">Direct WhatsApp</p>
                <p className="text-[9px] text-neutral-500 truncate">Chat Vendor</p>
              </div>
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
                  Semester Rush Clearance
                </span>
                <h4 className="text-base font-black leading-snug">
                  Up To 50% Off Campus Essentials
                </h4>
                <p className="text-[10px] text-amber-100">
                  Verified deals from graduating students.
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

        {/* 8. Vendor Spotlight Card (Mobile) */}
        <div className="px-4 pt-2">
          <div className="bg-neutral-900 rounded-3xl p-4 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold">Featured Campus Stores</h4>
              </div>
              <Link href="/vendors" className="text-xs text-emerald-400 font-semibold">
                View All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {vendors.slice(0, 2).map((v) => (
                <Link
                  key={v.id}
                  href={`/store/${v.slug}`}
                  className="bg-neutral-800/80 rounded-2xl p-3 border border-neutral-700/60 hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {v.storeName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-white">{v.storeName}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{v.campus.name.split(" ")[0]}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-400 mt-2 font-medium">
                    {v._count.products} Listings &rarr;
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP / LARGE SCREENS LAYOUT (Preserved Desktop View)    */}
      {/* ========================================================= */}
      <div className="hidden lg:block">
        {/* 1. HERO SECTION (CampusTrade Mint Green, Blush Pink & Pastel Yellow Theme) */}
        <section className="relative overflow-hidden bg-white pt-5 sm:pt-8 lg:pt-10 pb-8 sm:pb-10 lg:pb-12">
        <div className="w-[92%] sm:w-[90%] max-w-[1720px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-14 items-center w-full">
            {/* Left Column: Hero Text Content - Wide layout & vertically balanced */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-4 sm:space-y-6 lg:space-y-7 text-center lg:text-left w-full">
              {/* Trending Pill Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs sm:text-sm font-semibold shadow-xs">
                <span className="text-sm sm:text-base">🔥</span>
                <span>Trending Across Nigerian Campuses</span>
              </div>

              {/* Main Headline - Responsive typography */}
              <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-[62px] xl:text-[74px] 2xl:text-[82px] font-black text-neutral-950 tracking-tight leading-[1.08] sm:leading-[1.05] w-full">
                Discover Campus <br className="hidden sm:inline" />
                <span className="text-emerald-500">Products</span>
              </h1>

              {/* Subtitle - Spanning wide across the space without squeezing */}
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-neutral-600 leading-relaxed font-normal w-full max-w-2xl lg:max-w-none">
                The premier multi-vendor marketplace; built for students. Buy and sell textbooks, laptops, hostel gadgets, and thrift streetwear from verified peers across all universities and campuses.
              </p>

              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1 w-full sm:w-auto">
                <Link href="/shop" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto rounded-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 sm:px-9 py-3.5 sm:py-4 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 transition-all text-sm sm:text-base">
                    Shop Now <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
                  </Button>
                </Link>
                <Link href="/vendor/register" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full border-2 border-emerald-500 text-neutral-950 font-bold px-6 sm:px-9 py-3.5 sm:py-4 hover:bg-emerald-50/70 hover:-translate-y-0.5 transition-all text-sm sm:text-base">
                    Open Student Store
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                    alt="Student buyer"
                  />
                  <img
                    className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                    alt="Student buyer"
                  />
                  <img
                    className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
                    alt="Student buyer"
                  />
                  <img
                    className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
                    alt="Student buyer"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-700 mt-0.5">
                    Loved by 15,000+ verified campus students
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual - Horizontally Aligned on the same row */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center lg:justify-end w-full">
              <div className="relative w-full h-[250px] xs:h-[300px] sm:h-[400px] lg:h-[520px] xl:h-[580px] flex items-center justify-center lg:justify-end">
                <Image
                  src="/images/hero-shopping-items-transparent.png"
                  alt="Curated student shopping items arranged for hero section"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 860px"
                  className="object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.16)] hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST AND VALUE PROPOSITIONS BAR */}
      <TrustBar />

      {/* 3. SHOP BY CATEGORIES (NovaTrend Reference Layout) */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Shop by Categories
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Curated departments tailored to campus lifestyles and student budgets
              </p>
            </div>
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
            {categories.map((cat: any) => {
              const totalProducts =
                (cat._count?.products || 0) +
                (cat.children?.reduce((acc: number, c: any) => acc + (c._count?.products || 0), 0) || 0);

              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-100 hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[4/5] relative w-full overflow-hidden">
                    <Image
                      src={
                        categoryImages[cat.slug] ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
                      }
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/30 to-transparent"></div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                      <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-neutral-300 flex items-center justify-between mt-0.5">
                        <span>{totalProducts} Items</span>
                        <span className="text-purple-400 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all">
                          &rarr;
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FRESH CAMPUS DROPS / NEW ARRIVALS (Forma/NovaTrend Catalog) */}
      <section className="py-14 bg-neutral-50/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
                <span className="text-xs uppercase font-extrabold tracking-wider text-purple-700">
                  Live Campus Catalog
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 group"
            >
              <span>View All New Drops</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. DUAL PROMOTIONAL BANNERS (NovaTrend Reference Layout) */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promo 1: Flash Sale with Countdown */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 text-white p-5 sm:p-8 md:p-10 flex flex-col justify-between min-h-[280px] sm:min-h-[300px] shadow-xl shadow-orange-600/15">
              <div className="relative z-10 space-y-3">
                <Badge variant="dark" className="bg-white/20 backdrop-blur-md text-white border-0 text-xs font-bold">
                  Semester Rush Deals
                </Badge>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  Up To 50% Off <br />
                  Campus Essentials
                </h3>
                <p className="text-xs sm:text-sm text-amber-100 max-w-sm">
                  Limited inventory discounts from student vendors wrapping up their clearance sales.
                </p>

                {/* Countdown Timer Block */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-2">
                  <div className="bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-center min-w-[42px] sm:min-w-[48px]">
                    <span className="font-extrabold text-xs sm:text-base">02</span>
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">Days</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-center min-w-[42px] sm:min-w-[48px]">
                    <span className="font-extrabold text-xs sm:text-base">14</span>
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">Hours</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-center min-w-[42px] sm:min-w-[48px]">
                    <span className="font-extrabold text-xs sm:text-base">38</span>
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">Mins</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-center min-w-[42px] sm:min-w-[48px]">
                    <span className="font-extrabold text-xs sm:text-base">45</span>
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">Secs</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-5 sm:pt-6">
                <Link href="/shop?filter=sale">
                  <Button className="bg-white text-neutral-950 hover:bg-neutral-100 font-bold px-5 sm:px-6 shadow-md text-xs sm:text-sm">
                    Shop Flash Sale Now &rarr;
                  </Button>
                </Link>
              </div>

              {/* Decorative Sneaker / Cutout */}
              <div className="absolute -bottom-6 -right-6 w-56 h-56 opacity-25 lg:opacity-40 pointer-events-none">
                <Image
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"
                  alt="Sneaker flash sale"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Promo 2: Student Entrepreneurship / Seller Spotlight */}
            <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-5 sm:p-8 md:p-10 flex flex-col justify-between min-h-[280px] sm:min-h-[300px] shadow-xl">
              <div className="relative z-10 space-y-3">
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  Student Seller Community
                </Badge>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  Turn Your Drip or Skills <br />
                  Into Campus Income
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                  Launch your storefront in under 3 minutes. Pick your storefront layout, upload items, and receive WhatsApp orders.
                </p>
                <ul className="text-xs text-neutral-300 space-y-1.5 pt-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Zero upfront listing fees for student sellers</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Choice of 4 custom storefront layouts</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 pt-6">
                <Link href="/vendor/register">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 shadow-md rounded-full">
                    Register Your Store &rarr;
                  </Button>
                </Link>
              </div>

              {/* Decorative Background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <Image
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80"
                  alt="Student seller working"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED STUDENT VENDORS (UNILAG, UI, OAU) */}
      <section className="py-14 bg-neutral-50/70 border-t border-neutral-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Featured Campus Stores
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Top rated student entrepreneurs with active storefronts
              </p>
            </div>
            <Link
              href="/vendors"
              className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              <span>Explore All Vendors</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vendors.map((v) => (
              <Link
                key={v.id}
                href={`/store/${v.slug}`}
                className="group rounded-2xl bg-white border border-neutral-100 overflow-hidden shadow-xs hover:shadow-md hover:border-neutral-200 transition-all flex flex-col"
              >
                {/* Banner */}
                <div className="h-24 w-full relative bg-neutral-200 overflow-hidden">
                  {v.banner ? (
                    <Image
                      src={v.banner}
                      alt={v.storeName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700"></div>
                  )}
                </div>

                {/* Body with Logo Avatar */}
                <div className="p-4 pt-0 relative flex-grow flex flex-col justify-between">
                  <div>
                    <div className="-mt-7 mb-2 relative">
                      <div className="w-14 h-14 rounded-2xl border-2 border-white overflow-hidden shadow-md bg-white">
                        {v.logo ? (
                          <img
                            src={v.logo}
                            alt={v.storeName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                            {v.storeName[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-neutral-900 text-sm group-hover:text-emerald-600 transition-colors">
                      {v.storeName}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                      {v.storeDescription || "Verified campus student storefront."}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {v.campus.name.split(" ")[0]}
                    </span>
                    <span className="text-[11px] font-semibold bg-neutral-100 px-2 py-0.5 rounded-full">
                      {v._count.products} Listings
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
