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
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { MobileHeroSlider } from "@/components/marketplace/MobileHeroSlider";
import { DesktopHeroSlider } from "@/components/marketplace/DesktopHeroSlider";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { formatNGN } from "@/lib/utils";
import { getCategoryImage, CATEGORY_IMAGES } from "@/lib/category-images";
import { getCachedHomepageData } from "@/lib/db/queries";

export const revalidate = 60;

export default async function HomePage() {
  const { categories, newArrivals, vendors, cmsSettings = {} } =
    await getCachedHomepageData();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ========================================================= */}
      {/* MOBILE & TABLET SCREENS LAYOUT (Responsive < 1024px)       */}
      {/* ========================================================= */}
      <div className="lg:hidden bg-neutral-50/50 pb-10 md:pb-12 space-y-4 sm:space-y-6">
        {/* 1. Mobile & Tablet Search Bar & Filter */}
        <div className="px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 md:pt-6">
          <div className="flex items-center gap-2.5 max-w-2xl md:max-w-4xl mx-auto">
            <div className="flex-1">
              <SearchBar placeholder="What are you looking for?" />
            </div>
            <Link
              href="/shop?openFilters=true"
              className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-2xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-xs hover:border-emerald-500 transition-colors shrink-0"
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5 text-neutral-700" />
            </Link>
          </div>
        </div>

        {/* 2. Hero Promo Banner Slider (Full Width with Enhanced Height on Tablets) */}
        <div className="w-full -mt-2">
          <MobileHeroSlider />
        </div>

        {/* 3. Category Filter Chips */}
        <div className="px-4 sm:px-6 md:px-8 max-w-2xl md:max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
            <Link
              href="/shop"
              className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-emerald-500 text-white shadow-xs shrink-0"
            >
              All
            </Link>
            {categories.slice(0, 6).map((cat: any) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="inline-flex items-center gap-1.5 pl-1.5 pr-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-white border border-neutral-200/80 text-neutral-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors shrink-0 shadow-2xs"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden relative shrink-0 border border-neutral-200/80 flex items-center justify-center">
                  <Image
                    src={getCategoryImage(cat.slug)}
                    alt={cat.name}
                    fill
                    sizes="24px"
                    className="object-cover object-center"
                  />
                </div>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 4. Categories Visual Grid with Real Contextual Images */}
        <div className="px-4 sm:px-6 md:px-8 pt-1 max-w-2xl md:max-w-5xl mx-auto w-full">
          <div className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 border border-neutral-100 shadow-xs">
            <div className="flex items-center justify-between mb-3.5 sm:mb-5 md:mb-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-600" />
                <h3 className="font-bold text-sm sm:text-base md:text-lg text-neutral-900">Categories</h3>
              </div>
              <Link
                href="/shop"
                className="text-xs sm:text-sm md:text-base font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-y-4 sm:gap-y-6 gap-x-2 sm:gap-x-4">
              {categories.slice(0, 8).map((cat: any) => {
                const img = getCategoryImage(cat.slug);
                return (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    className="flex flex-col items-center justify-center group text-center"
                  >
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto rounded-2xl overflow-hidden bg-neutral-100 shadow-2xs border border-neutral-200/80 group-hover:border-emerald-500 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                      <Image
                        src={img}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 768px) 64px, 80px"
                        className="object-cover object-center group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-neutral-950/5 group-hover:bg-transparent transition-colors" />
                    </div>
                    <span className="text-[11px] sm:text-xs md:text-sm font-semibold text-neutral-800 group-hover:text-emerald-700 mt-1.5 sm:mt-2 leading-tight text-center line-clamp-1 w-full px-1">
                      {cat.name.split(" ")[0]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6. Recommended / Popular Products */}
        <div className="px-4 sm:px-6 md:px-8 pt-1 max-w-2xl md:max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-600" />
              <h3 className="font-bold text-sm sm:text-base md:text-lg text-neutral-900">Recommended For You</h3>
            </div>
            <Link
              href="/shop?sort=newest"
              className="text-xs sm:text-sm md:text-base font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>See more</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {newArrivals.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        </div>

        {/* 7. Secondary Middle Promo Banner */}
        <div className="px-4 sm:px-6 md:px-8 pt-2 max-w-2xl md:max-w-5xl mx-auto w-full">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-4 xs:p-5 sm:p-7 md:p-10 shadow-md">
            <div className="flex items-center justify-between">
              <div className="space-y-1 sm:space-y-2 md:space-y-3 z-10 max-w-[75%]">
                <span className="text-[10px] sm:text-xs md:text-sm uppercase font-extrabold tracking-wider text-amber-200">
                  {cmsSettings.flash_sale_badge || "Semester Rush Clearance"}
                </span>
                <h4 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-black leading-snug">
                  {cmsSettings.flash_sale_title || "Up To 50% Off Campus Essentials"}
                </h4>
                <p className="text-[10px] sm:text-xs md:text-base text-amber-100 max-w-xl">
                  {cmsSettings.flash_sale_subtitle || "Verified deals from graduating students."}
                </p>
              </div>
              <Link
                href="/shop?filter=sale"
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-white text-neutral-950 flex items-center justify-center font-bold shadow-md hover:scale-105 active:scale-95 transition-transform z-10 shrink-0 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7" />
              </Link>
            </div>
          </div>
        </div>

        {/* 8. Vendor Spotlight Card (Bright & Clean Swipeable Layout) */}
        <div className="px-4 sm:px-6 md:px-8 pt-1 pb-2 max-w-2xl md:max-w-5xl mx-auto w-full">
          <div className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 border border-neutral-100 shadow-xs space-y-3.5 sm:space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base md:text-lg font-bold text-neutral-900 leading-tight">Featured Campus Stores</h4>
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-500">Verified student sellers</p>
                </div>
              </div>
              <Link
                href="/vendors"
                className="text-xs sm:text-sm md:text-base text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Horizontal Scroll of Campus Stores */}
            <div className="flex items-stretch gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pb-1 pt-0.5">
              {vendors.map((v) => (
                <Link
                  key={v.id}
                  href={`/store/${v.slug}`}
                  prefetch={false}
                  className="w-[185px] sm:w-[220px] md:w-[240px] shrink-0 bg-neutral-50/70 hover:bg-emerald-50/30 rounded-2xl p-3 sm:p-4 border border-neutral-200/70 hover:border-emerald-300 transition-all flex flex-col justify-between group active:scale-[0.98] shadow-2xs"
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Header: Store Avatar + Verified Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-neutral-200/80 overflow-hidden shadow-2xs flex items-center justify-center font-bold text-emerald-700 text-sm sm:text-base shrink-0">
                        {v.logo ? (
                          <img src={v.logo} alt={v.storeName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white w-full h-full flex items-center justify-center text-xs sm:text-sm font-bold">
                            {v.storeName[0]}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                        Verified
                      </span>
                    </div>

                    {/* Store Name & Campus */}
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {v.storeName}
                      </p>
                      <p className="text-[10px] sm:text-xs text-neutral-500 flex items-center gap-0.5 line-clamp-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400 shrink-0" />
                        {v.campus.name}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Listings Count Pill */}
                  <div className="pt-2.5 sm:pt-3 mt-2 border-t border-neutral-200/60 flex items-center justify-between text-[10px] sm:text-xs">
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

        {/* 9. Student Seller Community Showcase Banner (Mobile & Tablet) */}
        <div className="px-4 sm:px-6 md:px-8 pt-2 max-w-2xl md:max-w-5xl mx-auto w-full">
          <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[360px] sm:min-h-[400px] shadow-xl">
            <div className="relative z-10 space-y-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] sm:text-xs font-bold">
                Student Seller Community
              </Badge>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                {cmsSettings.seller_promo_title || "Turn Your Drip or Skills Into Campus Income"}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                {cmsSettings.seller_promo_subtitle ||
                  "Launch your storefront in under 3 minutes. Pick your storefront layout, upload items, and receive WhatsApp orders."}
              </p>
              <ul className="text-xs text-neutral-300 space-y-2 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero upfront listing fees for student sellers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Choice of 4 custom storefront layouts</span>
                </li>
              </ul>
            </div>

            <div className="relative z-10 pt-6">
              <Link href="/auth/register?role=vendor">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-7 py-3 shadow-md rounded-full text-xs sm:text-sm">
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

        {/* 10. Campus Ambassador Hub Showcase Banner (Mobile & Tablet) */}
        <div className="px-4 sm:px-6 md:px-8 pt-2 pb-4 max-w-2xl md:max-w-5xl mx-auto w-full">
          <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[360px] sm:min-h-[400px] shadow-xl">
            <div className="relative z-10 space-y-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] sm:text-xs font-bold">
                Campus Ambassador Hub
              </Badge>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Represent ọjà &amp; Earn On Every Referral
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                Empower peers in your hostel and faculty to buy and sell safely. Earn direct cash bounties on every vendor and student you onboard.
              </p>
              <ul className="text-xs text-neutral-300 space-y-2 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom QR codes &amp; flyers for notice boards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct cash bounties paid into your bank account</span>
                </li>
              </ul>
            </div>

            <div className="relative z-10 pt-6">
              <Link href="/ambassador">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-7 py-3 shadow-md rounded-full text-xs sm:text-sm">
                  Join Ambassador Hub &rarr;
                </Button>
              </Link>
            </div>

            {/* Decorative Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <Image
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                alt="Campus students collaborating"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP / LARGE SCREENS LAYOUT (Preserved Desktop View)    */}
      {/* ========================================================= */}
      <div className="hidden lg:block">
        {/* 1. HERO SECTION (Interactive Desktop Hero Slider) */}
        <DesktopHeroSlider
          customHeroBadge={cmsSettings.hero_badge}
          customHeroTitle={cmsSettings.hero_title}
          customHeroSubtitle={cmsSettings.hero_subtitle}
          customHeroCta={cmsSettings.hero_cta_text}
        />

        {/* 2. SHOP BY CATEGORIES (NovaTrend Reference Layout) */}
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
                        src={getCategoryImage(cat.slug)}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
                        className="object-cover object-center group-hover:scale-108 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/30 to-transparent"></div>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                        <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-1">
                          {cat.name}
                        </h3>
                        <p className="text-[10px] text-neutral-300 flex items-center justify-between mt-0.5">
                          <span>{totalProducts} Items</span>
                          <span className="text-emerald-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all">
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

        {/* 5. DUAL PROMOTIONAL & COMMUNITY BANNERS (Increased Height & Ambassador Hub) */}
        <section className="py-14 bg-white">
          <div className="container mx-auto px-4 space-y-8">
            {/* Promo 1: Flash Sale with Countdown (Increased Height) */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 text-white p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col md:flex-row md:items-center justify-between min-h-[300px] md:min-h-[340px] shadow-xl shadow-orange-600/15">
              <div className="relative z-10 space-y-3.5 max-w-xl">
                <Badge variant="dark" className="bg-white/20 backdrop-blur-md text-white border-0 text-xs font-bold">
                  {cmsSettings.flash_sale_badge || "Semester Rush Deals"}
                </Badge>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  {cmsSettings.flash_sale_title || "Up To 50% Off Campus Essentials"}
                </h3>
                <p className="text-xs sm:text-sm text-amber-100 max-w-md">
                  {cmsSettings.flash_sale_subtitle ||
                    "Limited inventory discounts from student vendors wrapping up their clearance sales."}
                </p>

                {/* Countdown Timer Block */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-2">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center min-w-[48px]">
                    <span className="font-extrabold text-sm sm:text-base">02</span>
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">Days</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center min-w-[48px]">
                    <span className="font-extrabold text-sm sm:text-base">14</span>
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">Hours</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center min-w-[48px]">
                    <span className="font-extrabold text-sm sm:text-base">38</span>
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">Mins</span>
                  </div>
                  <span className="font-bold">:</span>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-center min-w-[48px]">
                    <span className="font-extrabold text-sm sm:text-base">45</span>
                    <span className="block text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">Secs</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-6 md:pt-0">
                <Link href="/shop?filter=sale">
                  <Button className="bg-white text-neutral-950 hover:bg-neutral-100 font-bold px-6 py-3.5 shadow-md text-xs sm:text-sm rounded-full">
                    Shop Flash Sale Now &rarr;
                  </Button>
                </Link>
              </div>

              {/* Decorative Sneaker / Cutout */}
              <div className="absolute -bottom-6 -right-6 w-64 h-64 opacity-25 lg:opacity-40 pointer-events-none">
                <Image
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"
                  alt="Sneaker flash sale"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Dual Community Pillars: Student Seller Banner & Campus Ambassador Hub Banner (Increased Height) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Promo 2: Student Entrepreneurship / Seller Spotlight */}
              <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between min-h-[380px] sm:min-h-[420px] md:min-h-[460px] shadow-xl">
                <div className="relative z-10 space-y-3.5">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    Student Seller Community
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                    {cmsSettings.seller_promo_title || "Turn Your Drip or Skills Into Campus Income"}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                    {cmsSettings.seller_promo_subtitle ||
                      "Launch your storefront in under 3 minutes. Pick your storefront layout, upload items, and receive WhatsApp orders."}
                  </p>
                  <ul className="text-xs text-neutral-300 space-y-2 pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Zero upfront listing fees for student sellers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Choice of 4 custom storefront layouts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Direct WhatsApp orders with safe Escrow</span>
                    </li>
                  </ul>
                </div>

                <div className="relative z-10 pt-6">
                  <Link href="/auth/register?role=vendor">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-7 py-3 shadow-md rounded-full text-xs sm:text-sm">
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

              {/* Promo 3: Campus Ambassador Hub Spotlight */}
              <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between min-h-[380px] sm:min-h-[420px] md:min-h-[460px] shadow-xl">
                <div className="relative z-10 space-y-3.5">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    Campus Ambassador Hub
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                    Represent ọjà &amp; Earn On Every Referral
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                    Empower peers in your hostel and faculty to buy and sell safely. Earn direct cash bounties on every vendor and student you onboard.
                  </p>
                  <ul className="text-xs text-neutral-300 space-y-2 pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Custom QR codes &amp; flyers for campus notice boards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Direct cash bounties paid into your bank account</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Real-time dashboard tracking signups &amp; earnings</span>
                    </li>
                  </ul>
                </div>

                <div className="relative z-10 pt-6">
                  <Link href="/ambassador">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-7 py-3 shadow-md rounded-full text-xs sm:text-sm">
                      Join Ambassador Hub &rarr;
                    </Button>
                  </Link>
                </div>

                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <Image
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                    alt="Campus students collaborating"
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
                  prefetch={false}
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
