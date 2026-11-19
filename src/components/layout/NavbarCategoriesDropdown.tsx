"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  MapPin,
  Tag,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useCategories, CategoryItem } from "@/hooks/use-categories-query";
import { useCampuses } from "@/hooks/use-campuses-query";
import { getCategoryImage } from "@/lib/category-images";

const CONDITIONS = [
  { label: "Brand New", value: "NEW" },
  { label: "Like New", value: "USED_LIKE_NEW" },
  { label: "Good Condition", value: "USED_GOOD" },
  { label: "Fair", value: "USED_FAIR" },
];

const PRICE_RANGES = [
  { label: "Under ₦5,000", maxPrice: "5000" },
  { label: "₦5k - ₦20k", minPrice: "5000", maxPrice: "20000" },
  { label: "₦20k - ₦50k", minPrice: "20000", maxPrice: "50000" },
  { label: "₦50,000+", minPrice: "50000" },
];

const SELLER_TYPES = [
  { label: "Student Sellers", value: "student" },
  { label: "Campus Vendors", value: "guest" },
];

export function NavbarCategoriesDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const { data: catData } = useCategories();
  const { data: campusData } = useCampuses();

  const categories: CategoryItem[] = catData?.categories || [];
  const campuses = campusData?.campuses || [];

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div
      className="relative hidden lg:block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => handleNavigate("/shop")}
        className={`px-3.5 py-2 text-sm rounded-full transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
          isOpen
            ? "text-emerald-800 bg-emerald-50 font-bold"
            : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
        }`}
        aria-expanded={isOpen}
      >
        <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
        <span>Categories</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Flyout Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full -left-20 xl:left-0 pt-2.5 z-50 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="w-[780px] xl:w-[840px] bg-white rounded-3xl border border-neutral-200/90 shadow-2xl shadow-neutral-900/10 p-5 flex">
            {/* ======================================================== */}
            {/* LEFT COLUMN: Categories (Neatly Arranged & Scrollable)    */}
            {/* ======================================================== */}
            <div className="w-[48%] pr-5 border-r border-neutral-100 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                      Categories
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      {categories.length > 0 ? `${categories.length} campus departments` : "Explore goods"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavigate("/shop")}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>All ({categories.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Scrollable Category List */}
              <div className="max-h-[360px] overflow-y-auto pr-2 space-y-1 scrollbar-thin">
                {categories.map((cat) => {
                  const productCount =
                    (cat._count?.products || 0) +
                    (cat.children?.reduce((acc, ch) => acc + (ch._count?.products || 0), 0) || 0);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleNavigate(`/shop?category=${cat.slug}`)}
                      className="w-full group p-2 rounded-2xl hover:bg-emerald-50/70 text-left transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 border border-neutral-200/80 bg-neutral-100">
                          <Image
                            src={getCategoryImage(cat.slug)}
                            alt={cat.name}
                            fill
                            sizes="36px"
                            className="object-cover object-center group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-800 group-hover:text-emerald-950 truncate transition-colors">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            {productCount > 0 ? `${productCount} listings` : "Browse products"}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}

                {categories.length === 0 && (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    Loading categories...
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: Filter Options (Neatly Arranged)           */}
            {/* ======================================================== */}
            <div className="w-[52%] pl-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                        Filter Options
                      </h4>
                      <p className="text-[10px] text-neutral-400">
                        Campus, condition &amp; budget
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigate("/shop")}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Filter 1: University Campus */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>University Campus</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleNavigate("/shop")}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer"
                    >
                      All Campuses
                    </button>
                    {campuses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleNavigate(`/shop?campus=${c.slug}`)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent transition-all cursor-pointer"
                      >
                        {c.name.split(" ")[0]} ({c.city})
                      </button>
                    ))}
                    {campuses.length === 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleNavigate("/shop?campus=unilag")}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          UNILAG (Lagos)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNavigate("/shop?campus=ui")}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          UI (Ibadan)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNavigate("/shop?campus=oau")}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          OAU (Ile-Ife)
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Filter 2: Condition */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-emerald-600" />
                    <span>Item Condition</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CONDITIONS.map((cond) => (
                      <button
                        key={cond.value}
                        type="button"
                        onClick={() => handleNavigate(`/shop?condition=${cond.value}`)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter 3: Price Range */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Price Range</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRICE_RANGES.map((pr) => {
                      const params = new URLSearchParams();
                      if (pr.minPrice) params.set("minPrice", pr.minPrice);
                      if (pr.maxPrice) params.set("maxPrice", pr.maxPrice);
                      return (
                        <button
                          key={pr.label}
                          type="button"
                          onClick={() => handleNavigate(`/shop?${params.toString()}`)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          {pr.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter 4: Seller Type */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-700">Seller Type</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SELLER_TYPES.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => handleNavigate(`/shop?sellerType=${st.value}`)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-4 border-t border-neutral-100 mt-4">
                <button
                  type="button"
                  onClick={() => handleNavigate("/shop")}
                  className="w-full h-10 px-4 rounded-2xl bg-neutral-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Explore Marketplace with Selected Filters</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
