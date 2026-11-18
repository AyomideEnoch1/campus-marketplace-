"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  Headphones,
  Smartphone,
  BookOpen,
  Shirt,
  Sparkles,
  Flame,
  Tag,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  Send,
  Check,
  Package,
} from "lucide-react";
import { formatNGN } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  condition?: string;
  category?: { name: string; slug: string };
  images: { url: string }[];
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

interface DesktopReferenceLayoutProps {
  categories: CategoryItem[];
  allProducts: ProductItem[];
  recommendations: ProductItem[];
  totalProductCount?: number;
}

export function DesktopReferenceLayout({
  categories = [],
  allProducts = [],
  recommendations = [],
  totalProductCount = 20,
}: DesktopReferenceLayoutProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedFilter, setSelectedFilter] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeSearch, setActiveSearch] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [newsletterEmail, setNewsletterEmail] = React.useState<string>("");
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState<boolean>(false);
  const [addingId, setAddingId] = React.useState<string | null>(null);

  // Filter products based on selected category, filter, and search
  const filteredProducts = React.useMemo(() => {
    return allProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== "all") {
        const catSlug = product.category?.slug || "";
        if (catSlug !== selectedCategory && !catSlug.includes(selectedCategory)) {
          return false;
        }
      }

      // Quick filter
      if (selectedFilter === "discount") {
        // Show lower priced items as discount
        if (product.price > 30000) return false;
      }

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
  }, [allProducts, selectedCategory, selectedFilter, activeSearch]);

  // Pagination (6 items per page for 3x2 grid, or 9 for 3x3)
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

  const handleAddToCart = async (product: ProductItem) => {
    setAddingId(product.id);
    const primaryImg = product.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";

    const added = await addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      image: primaryImg,
      quantity: 1,
      condition: product.condition || "Used - Good Condition",
      vendor: {
        id: product.vendor.id,
        storeName: product.vendor.storeName,
        slug: product.vendor.slug,
        whatsapp: product.vendor.whatsapp || undefined,
        campus: product.vendor.campus || undefined,
        sellerType: (product.vendor.sellerType as any) || "student",
        verificationTier: product.vendor.verificationTier,
        isTrustedSeller: product.vendor.isTrustedSeller,
        isRegisteredBusiness: product.vendor.isRegisteredBusiness,
      },
    });

    if (added) {
      toast.success(`Added "${product.title}" to bag!`);
    }
    setTimeout(() => setAddingId(null), 600);
  };

  const handleBuyNow = async (product: ProductItem) => {
    await handleAddToCart(product);
    router.push("/checkout");
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid campus email address.");
      return;
    }
    setNewsletterSubscribed(true);
    toast.success("Subscribed! You'll receive student discount alerts.");
    setNewsletterEmail("");
  };

  // Category Icon Resolver
  const getCategoryIcon = (slug: string) => {
    if (slug.includes("hostel") || slug.includes("home") || slug.includes("kitchen") || slug.includes("bedding")) {
      return Home;
    }
    if (slug.includes("audio") || slug.includes("music") || slug.includes("headphone")) {
      return Headphones;
    }
    if (slug.includes("phone") || slug.includes("electronic") || slug.includes("gadget")) {
      return Smartphone;
    }
    if (slug.includes("book") || slug.includes("academic") || slug.includes("stationery")) {
      return BookOpen;
    }
    if (slug.includes("fashion") || slug.includes("wear") || slug.includes("shoes")) {
      return Shirt;
    }
    return Package;
  };

  // Category Pill Tag Resolver
  const getCategoryPillLabel = (product: ProductItem) => {
    const slug = product.category?.slug || "";
    if (slug.includes("audio") || slug.includes("headphone")) return "Music";
    if (slug.includes("hostel") || slug.includes("home")) return "Home";
    if (slug.includes("phone") || slug.includes("electronic")) return "Tech";
    if (slug.includes("fashion") || slug.includes("wear")) return "Fashion";
    if (slug.includes("book") || slug.includes("academic")) return "Books";
    return product.category?.name?.split(" ")?.[0] || "Other";
  };

  return (
    <div className="bg-[#fcfcfc] text-neutral-900 pb-16">
      {/* ======================================================== */}
      {/* 1. HERO BANNER WITH GIANT "Shop" TYPOGRAPHY              */}
      {/* ======================================================== */}
      <div className="relative w-full h-[340px] overflow-hidden bg-neutral-900">
        {/* Modern Warm Architectural / Interior Photo Background */}
        <Image
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1800&q=85"
          alt="CampusTrade Modern Interior Shop"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center brightness-[0.78] contrast-[1.05]"
        />

        {/* Ambient Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 pointer-events-none" />

        {/* Giant Centered "Shop" Typography */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <h1 className="text-white text-[120px] lg:text-[150px] font-black tracking-tight leading-none drop-shadow-sm opacity-95">
            Shop
          </h1>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OVERLAPPING WHITE MAIN CONTAINER CARD                 */}
      {/* ======================================================== */}
      <div className="container mx-auto px-6 max-w-7xl relative -mt-16 z-20">
        <div className="bg-white rounded-[32px] p-6 lg:p-10 shadow-xl border border-neutral-150/80">
          {/* Header Row: "Give All You Need" + Integrated Search */}
          <div className="flex items-center justify-between pb-8 border-b border-neutral-100 gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-neutral-900 tracking-tight">
                Give All You Need
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Verified student items, hostel gear, textbooks, and campus essentials
              </p>
            </div>

            {/* Integrated Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full justify-end">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search on CampusTrade"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-full text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors shrink-0 shadow-xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* Catalog Layout: 2 Columns (Sidebar + 3-Column Grid) */}
          <div className="grid grid-cols-12 gap-8 pt-8">
            {/* ---------------------------------------------------- */}
            {/* LEFT SIDEBAR: Categories & Filters                   */}
            {/* ---------------------------------------------------- */}
            <div className="col-span-3 space-y-6 pr-2">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight mb-3">
                  Category
                </h3>

                {/* All Product Top Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedFilter(null);
                    setCurrentPage(1);
                  }}
                  className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                    selectedCategory === "all" && !selectedFilter
                      ? "bg-neutral-100 text-neutral-950 shadow-2xs"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-neutral-600" />
                    All Product
                  </span>
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {totalProductCount}
                  </span>
                </button>

                {/* Subcategory Tree with Left Guide Border */}
                <div className="border-l-2 border-neutral-200 ml-5 pl-4 space-y-2.5 mt-3 pt-1">
                  {categories.slice(0, 5).map((cat) => {
                    const IconComponent = getCategoryIcon(cat.slug);
                    const isSelected = selectedCategory === cat.slug;
                    const count = cat._count?.products || 0;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.slug);
                          setSelectedFilter(null);
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between text-xs transition-colors py-1 text-left ${
                          isSelected
                            ? "font-extrabold text-neutral-950"
                            : "font-medium text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <IconComponent className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">For {cat.name.split(" ")[0]}</span>
                        </span>
                        {count > 0 && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Filters */}
              <div className="pt-4 border-t border-neutral-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilter(selectedFilter === "new" ? null : "new");
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center gap-2.5 text-xs py-1.5 transition-colors text-left ${
                    selectedFilter === "new"
                      ? "font-extrabold text-neutral-950"
                      : "font-medium text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-neutral-400" />
                  <span>New Arrival</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilter(selectedFilter === "best" ? null : "best");
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center gap-2.5 text-xs py-1.5 transition-colors text-left ${
                    selectedFilter === "best"
                      ? "font-extrabold text-neutral-950"
                      : "font-medium text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  <Flame className="w-4 h-4 text-neutral-400" />
                  <span>Best Seller</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilter(selectedFilter === "discount" ? null : "discount");
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center gap-2.5 text-xs py-1.5 transition-colors text-left ${
                    selectedFilter === "discount"
                      ? "font-extrabold text-neutral-950"
                      : "font-medium text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  <Tag className="w-4 h-4 text-neutral-400" />
                  <span>On Discount</span>
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: 3-Column Product Grid                  */}
            {/* ---------------------------------------------------- */}
            <div className="col-span-9 flex flex-col justify-between">
              {currentProducts.length === 0 ? (
                <div className="py-20 text-center text-neutral-400 text-xs rounded-2xl bg-neutral-50 border border-neutral-100">
                  <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                  <p className="font-bold text-neutral-700">No products found</p>
                  <p className="mt-1">Try clearing filters or searching for something else.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedFilter(null);
                      setActiveSearch("");
                      setSearchQuery("");
                    }}
                    className="mt-4 px-4 py-2 bg-neutral-950 text-white rounded-full font-bold text-xs hover:bg-neutral-800 transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {currentProducts.map((product) => {
                    const imgUrl = product.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";
                    const pillCategory = getCategoryPillLabel(product);

                    return (
                      <div
                        key={product.id}
                        className="flex flex-col group transition-all duration-300"
                      >
                        {/* Rounded Image Box */}
                        <div className="relative aspect-square rounded-[24px] bg-[#f5f5f5] hover:bg-[#ededed] p-6 flex items-center justify-center overflow-hidden transition-all duration-300 border border-neutral-150">
                          {/* Category Tag (Top Right) */}
                          <span className="absolute top-3.5 right-3.5 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 text-neutral-600 shadow-2xs border border-neutral-200/80">
                            {pillCategory}
                          </span>

                          {/* Centered Product Image */}
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Image
                              src={imgUrl}
                              alt={product.title}
                              fill
                              sizes="300px"
                              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 drop-shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Title & Price Row */}
                        <div className="pt-3.5 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${product.slug}`}
                              className="font-bold text-sm text-neutral-900 hover:text-emerald-700 transition-colors line-clamp-1 flex-1"
                              title={product.title}
                            >
                              {product.title}
                            </Link>
                            <span className="font-extrabold text-sm text-neutral-950 whitespace-nowrap">
                              {formatNGN(product.price)}
                            </span>
                          </div>

                          {/* Star Rating & Reviews */}
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                            <div className="flex items-center text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            </div>
                            <span className="font-bold text-neutral-800">5.0</span>
                            <span className="text-neutral-400">(1.2k Reviews)</span>
                          </div>

                          {/* Action Buttons: Add to Cart & Buy Now */}
                          <div className="flex items-center gap-2 pt-2.5">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              disabled={addingId === product.id}
                              className="flex-1 py-2 px-3 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs transition-colors shadow-2xs text-center"
                            >
                              {addingId === product.id ? "Added!" : "Add to Cart"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleBuyNow(product)}
                              className="flex-1 py-2 px-3 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs text-center"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-10 mt-6 border-t border-neutral-100 text-xs font-semibold text-neutral-600">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 hover:text-neutral-950 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isActive
                            ? "bg-neutral-950 text-white"
                            : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
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
                  className="flex items-center gap-1 hover:text-neutral-950 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. EXPLORE OUR RECOMMENDATIONS CAROUSEL / ROW            */}
        {/* ======================================================== */}
        <div className="pt-14 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
              Explore our recomendations
            </h3>

            {/* Slider Arrow Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-9 h-9 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition-colors shadow-2xs"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row of Recommendation Cards */}
          <div className="grid grid-cols-3 gap-6">
            {recommendations.slice(0, 3).map((product) => {
              const imgUrl = product.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";
              const pillCategory = getCategoryPillLabel(product);

              return (
                <div key={product.id} className="flex flex-col group">
                  {/* Rounded Image Box */}
                  <div className="relative aspect-square rounded-[24px] bg-[#f5f5f5] hover:bg-[#ededed] p-6 flex items-center justify-center overflow-hidden transition-all duration-300 border border-neutral-150">
                    <span className="absolute top-3.5 right-3.5 px-3 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 text-neutral-600 shadow-2xs border border-neutral-200/80">
                      {pillCategory}
                    </span>

                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={imgUrl}
                        alt={product.title}
                        fill
                        sizes="300px"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 drop-shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Title & Price */}
                  <div className="pt-3.5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-bold text-sm text-neutral-900 hover:text-emerald-700 transition-colors line-clamp-1 flex-1"
                        title={product.title}
                      >
                        {product.title}
                      </Link>
                      <span className="font-extrabold text-sm text-neutral-950 whitespace-nowrap">
                        {formatNGN(product.price)}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                      <span className="font-bold text-neutral-800">5.0</span>
                      <span className="text-neutral-400">(1.2k Reviews)</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2 pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 py-2 px-3 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs transition-colors shadow-2xs text-center"
                      >
                        Add to Cart
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBuyNow(product)}
                        className="flex-1 py-2 px-3 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-xs text-center"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. READY TO GET OUR NEW STUFF? BOTTOM CTA BANNER         */}
        {/* ======================================================== */}
        <div className="mt-14 rounded-[32px] bg-neutral-950 text-white p-8 lg:p-12 shadow-xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Headline & Email Input */}
          <div className="space-y-4 max-w-md w-full">
            <h3 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Ready to Get<br />Our New Stuff?
            </h3>

            {/* Email Pill Input */}
            <form onSubmit={handleNewsletterSubmit} className="flex items-center bg-white rounded-full p-1.5 shadow-md">
              <input
                type="email"
                placeholder="Your Email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full pl-4 pr-2 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold px-6 py-2 rounded-full transition-colors shrink-0 shadow-xs"
              >
                Send
              </button>
            </form>
          </div>

          {/* Right: Description & Platform Info */}
          <div className="max-w-md space-y-2 text-right md:text-left">
            <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              CampusTrade for Homes and Needs
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We listen to your campus needs, identify the best verified student sellers, and provide instant escrow protection for every single order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
