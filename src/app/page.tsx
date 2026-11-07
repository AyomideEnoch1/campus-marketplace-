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
      {/* 1. HERO SECTION (NovaTrend Reference Layout) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-white pt-8 pb-16 md:pt-14 md:pb-24">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Call to Actions */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Trending Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold tracking-wide">
                <Flame className="w-4 h-4 text-emerald-600 fill-emerald-600 animate-pulse" />
                <span>TRENDING ACROSS NIGERIAN CAMPUSES</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-950 tracking-tight leading-[1.08]">
                Discover Products <br className="hidden sm:inline" />
                <span className="text-emerald-600 underline decoration-emerald-200 decoration-wavy decoration-2">
                  You&apos;ll Love
                </span>{" "}
                on Campus.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-neutral-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                The premier multi-vendor marketplace built for students. Buy and sell textbooks, laptops, hostel gadgets, and thrift streetwear from verified peers at UNILAG, UI & OAU.
              </p>

              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link href="/shop" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25">
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/vendor/register" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-neutral-300 text-neutral-900 hover:bg-neutral-50">
                    Open Student Store
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                    alt="Student buyer"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                    alt="Student buyer"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
                    alt="Student buyer"
                  />
                  <img
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
                    alt="Student buyer"
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-neutral-800">
                    Loved by 15,000+ verified campus students
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual with Floating Product Cards (NovaTrend Style) */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-[540px] aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-tr from-emerald-100 to-amber-50 border-4 border-white group">
                <Image
                  src="/images/hero-campus-marketplace.png"
                  alt="Nigerian university campus students shopping and browsing stalls at CampusTrade marketplace"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 540px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Card 1: Top Right (Sneaker / Fashion) */}
                <div className="absolute top-4 right-2 sm:top-5 sm:right-4 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl shadow-xl border border-neutral-100 flex items-center gap-2.5 animate-bounce [animation-duration:4s]">
                  <img
                    src="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=120&q=80"
                    alt="Jordan 1"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-bold text-neutral-900">Air Jordan 1 Retro</p>
                    <p className="text-xs font-extrabold text-emerald-600">₦38,500</p>
                  </div>
                </div>

                {/* Floating Card 2: Mid Left (Gadget / Electronics) */}
                <div className="absolute top-1/2 -left-2 sm:left-3 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl shadow-xl border border-neutral-100 flex items-center gap-2.5 animate-bounce [animation-duration:5s]">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80"
                    alt="Headphones"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-bold text-neutral-900">Sony WH-1000XM4</p>
                    <p className="text-xs font-extrabold text-emerald-600">₦165,000</p>
                  </div>
                </div>

                {/* Floating Card 3: Bottom Right (Live Student Drops Badge) */}
                <div className="absolute bottom-4 right-2 sm:bottom-5 sm:right-4 bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl shadow-xl border border-neutral-100 flex items-center gap-2.5 animate-bounce [animation-duration:4.5s]">
                  <img
                    src="https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=120&q=80"
                    alt="Rechargeable Fan"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-bold text-neutral-900">16&quot; Mist Stand Fan</p>
                    <p className="text-xs font-extrabold text-emerald-600">₦48,000</p>
                  </div>
                </div>
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
              className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
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
                        <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform">
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
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600">
                  Live Campus Catalog
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
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
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 text-white p-8 sm:p-10 flex flex-col justify-between min-h-[300px] shadow-xl shadow-orange-600/15">
              <div className="relative z-10 space-y-3">
                <Badge variant="dark" className="bg-white/20 backdrop-blur-md text-white border-0 text-xs font-bold">
                  Semester Rush Deals
                </Badge>
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Up To 50% Off <br />
                  Campus Essentials
                </h3>
                <p className="text-xs sm:text-sm text-amber-100 max-w-sm">
                  Limited inventory discounts from student vendors wrapping up their clearance sales.
                </p>

                {/* Countdown Timer Block */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center">
                    <span className="font-extrabold text-sm sm:text-base">02</span>
                    <span className="block text-[9px] uppercase tracking-wider text-amber-200">Days</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center">
                    <span className="font-extrabold text-sm sm:text-base">14</span>
                    <span className="block text-[9px] uppercase tracking-wider text-amber-200">Hours</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center">
                    <span className="font-extrabold text-sm sm:text-base">38</span>
                    <span className="block text-[9px] uppercase tracking-wider text-amber-200">Mins</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center">
                    <span className="font-extrabold text-sm sm:text-base">45</span>
                    <span className="block text-[9px] uppercase tracking-wider text-amber-200">Secs</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-6">
                <Link href="/shop?filter=sale">
                  <Button className="bg-white text-neutral-950 hover:bg-neutral-100 font-bold px-6 shadow-md">
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
            <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-8 sm:p-10 flex flex-col justify-between min-h-[300px] shadow-xl">
              <div className="relative z-10 space-y-3">
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  Student Seller Community
                </Badge>
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
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
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md">
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
                    <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-teal-700"></div>
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

                    <h3 className="font-bold text-neutral-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {v.storeName}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                      {v.storeDescription || "Verified campus student storefront."}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                      <MapPin className="w-3.5 h-3.5" />
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
  );
}
