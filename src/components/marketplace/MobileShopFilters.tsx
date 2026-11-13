"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  MapPin,
  ArrowUpDown,
  Tag,
  DollarSign,
  Store,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CampusItem {
  id: string;
  name: string;
  slug: string;
}

interface VendorItem {
  id: string;
  storeName: string;
  slug: string;
  campus?: { name: string; slug: string } | null;
  _count?: { products: number };
}

interface MobileShopFiltersProps {
  campuses: CampusItem[];
  vendors: VendorItem[];
  totalProductsCount: number;
}

export function MobileShopFilters({
  campuses,
  vendors,
  totalProductsCount,
}: MobileShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "campus" | "sort" | "price" | "condition">("all");

  // Current URL filter states
  const currentQ = searchParams.get("q") || "";
  const currentCampus = searchParams.get("campus") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentCondition = searchParams.get("condition") || "";
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentSort = searchParams.get("sort") || "";
  const currentVendor = searchParams.get("vendor") || "";
  const currentSellerType = searchParams.get("sellerType") || "";

  // Local draft state for drawer
  const [draftCampus, setDraftCampus] = React.useState(currentCampus);
  const [draftCondition, setDraftCondition] = React.useState(currentCondition);
  const [draftMinPrice, setDraftMinPrice] = React.useState(currentMinPrice);
  const [draftMaxPrice, setDraftMaxPrice] = React.useState(currentMaxPrice);
  const [draftSort, setDraftSort] = React.useState(currentSort);
  const [draftVendor, setDraftVendor] = React.useState(currentVendor);
  const [draftSellerType, setDraftSellerType] = React.useState(currentSellerType);

  // Sync draft state when drawer opens or searchParams change
  React.useEffect(() => {
    setDraftCampus(currentCampus);
    setDraftCondition(currentCondition);
    setDraftMinPrice(currentMinPrice);
    setDraftMaxPrice(currentMaxPrice);
    setDraftSort(currentSort);
    setDraftVendor(currentVendor);
    setDraftSellerType(currentSellerType);
  }, [
    currentCampus,
    currentCondition,
    currentMinPrice,
    currentMaxPrice,
    currentSort,
    currentVendor,
    currentSellerType,
    isOpen,
  ]);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Count active filters (excluding category and sort for clearer badge)
  const activeCount = [
    currentQ,
    currentCampus,
    currentCondition,
    currentMinPrice || currentMaxPrice,
    currentVendor,
    currentSellerType,
    currentSort && currentSort !== "newest" ? currentSort : "",
  ].filter(Boolean).length;

  // Helper to build URL with updated params
  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    return `${pathname}?${params.toString()}`;
  };

  const handleApply = () => {
    const nextUrl = buildUrl({
      campus: draftCampus,
      condition: draftCondition,
      minPrice: draftMinPrice,
      maxPrice: draftMaxPrice,
      sort: draftSort,
      vendor: draftVendor,
      sellerType: draftSellerType,
      q: currentQ || null,
    });
    setIsOpen(false);
    router.push(nextUrl);
  };

  const handleResetAll = () => {
    setDraftCampus("");
    setDraftCondition("");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftSort("");
    setDraftVendor("");
    setDraftSellerType("");

    const params = new URLSearchParams();
    if (currentCategory) params.set("category", currentCategory);
    setIsOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  };

  const removeFilter = (key: string) => {
    if (key === "price") {
      router.push(buildUrl({ minPrice: null, maxPrice: null }));
    } else {
      router.push(buildUrl({ [key]: null }));
    }
  };

  const selectedCampusObj = campuses.find((c) => c.slug === currentCampus);
  const selectedVendorObj = vendors.find((v) => v.slug === currentVendor);

  const pricePresetLabel = () => {
    if (currentMinPrice === "100000") return "Over ₦100k";
    if (currentMaxPrice === "10000") return "Under ₦10k";
    if (currentMinPrice === "10000" && currentMaxPrice === "30000") return "₦10k - ₦30k";
    if (currentMinPrice === "30000" && currentMaxPrice === "100000") return "₦30k - ₦100k";
    if (currentMinPrice || currentMaxPrice) return `₦${currentMinPrice || "0"} - ₦${currentMaxPrice || "∞"}`;
    return null;
  };

  const sortLabel = () => {
    if (currentSort === "price-asc") return "Price: Low to High";
    if (currentSort === "price-desc") return "Price: High to Low";
    if (currentSort === "newest") return "Newest";
    return null;
  };

  const conditionLabel = () => {
    switch (currentCondition) {
      case "NEW":
        return "Brand New";
      case "USED_LIKE_NEW":
        return "Like New";
      case "USED_GOOD":
        return "Good";
      case "USED_FAIR":
        return "Fair";
      default:
        return null;
    }
  };

  return (
    <div className="lg:hidden w-full space-y-2">
      {/* 1. Quick Filters Horizontal Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {/* Main Filter Button */}
        <button
          onClick={() => {
            setActiveTab("all");
            setIsOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all shadow-xs ${
            activeCount > 0
              ? "bg-emerald-600 text-white shadow-emerald-600/20"
              : "bg-neutral-900 text-white hover:bg-neutral-800"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-emerald-800 text-[10px] font-black flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Campus Selector Pill */}
        <button
          onClick={() => {
            setActiveTab("campus");
            setIsOpen(true);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors border shadow-2xs ${
            currentCampus
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
              : "bg-white text-neutral-700 border-neutral-200/90 hover:bg-neutral-50"
          }`}
        >
          <MapPin className="w-3 h-3 text-emerald-600" />
          <span className="truncate max-w-[110px]">
            {selectedCampusObj ? selectedCampusObj.name.split(" ")[0] : "Campus"}
          </span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </button>

        {/* Sort Pill */}
        <button
          onClick={() => {
            setActiveTab("sort");
            setIsOpen(true);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors border shadow-2xs ${
            currentSort && currentSort !== "newest"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
              : "bg-white text-neutral-700 border-neutral-200/90 hover:bg-neutral-50"
          }`}
        >
          <ArrowUpDown className="w-3 h-3 text-neutral-500" />
          <span>{sortLabel() || "Sort"}</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </button>

        {/* Price Pill */}
        <button
          onClick={() => {
            setActiveTab("price");
            setIsOpen(true);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors border shadow-2xs ${
            pricePresetLabel()
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
              : "bg-white text-neutral-700 border-neutral-200/90 hover:bg-neutral-50"
          }`}
        >
          <Tag className="w-3 h-3 text-neutral-500" />
          <span>{pricePresetLabel() || "Price"}</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </button>

        {/* Condition Pill */}
        <button
          onClick={() => {
            setActiveTab("condition");
            setIsOpen(true);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors border shadow-2xs ${
            currentCondition
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
              : "bg-white text-neutral-700 border-neutral-200/90 hover:bg-neutral-50"
          }`}
        >
          <span>{conditionLabel() || "Condition"}</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </button>

        {/* Clear Button if any filter active */}
        {activeCount > 0 && (
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 2. Active Filter Chips Row (Dismissible) */}
      {activeCount > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 shrink-0">Active:</span>

          {currentQ && (
            <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 border border-neutral-200/90 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
              <span className="text-[10px] text-neutral-500 font-normal">Search:</span>
              <span className="truncate max-w-[90px]">&ldquo;{currentQ}&rdquo;</span>
              <button
                onClick={() => removeFilter("q")}
                className="hover:text-neutral-950 p-0.5 text-neutral-400 hover:text-neutral-700"
                aria-label="Remove search filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCampusObj && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
              <span>{selectedCampusObj.name.split(" ")[0]}</span>
              <button
                onClick={() => removeFilter("campus")}
                className="hover:text-emerald-950 p-0.5"
                aria-label="Remove campus filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {pricePresetLabel() && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
              <span>{pricePresetLabel()}</span>
              <button
                onClick={() => removeFilter("price")}
                className="hover:text-emerald-950 p-0.5"
                aria-label="Remove price filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {conditionLabel() && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
              <span>{conditionLabel()}</span>
              <button
                onClick={() => removeFilter("condition")}
                className="hover:text-emerald-950 p-0.5"
                aria-label="Remove condition filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedVendorObj && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
              <span>{selectedVendorObj.storeName}</span>
              <button
                onClick={() => removeFilter("vendor")}
                className="hover:text-emerald-950 p-0.5"
                aria-label="Remove vendor filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentSellerType && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
              <span>{currentSellerType === "student" ? "Student Vendors" : "Guest Vendors"}</span>
              <button
                onClick={() => removeFilter("sellerType")}
                className="hover:text-emerald-950 p-0.5"
                aria-label="Remove seller type filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {currentSort && currentSort !== "newest" && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
              <span>{sortLabel()}</span>
              <button
                onClick={() => removeFilter("sort")}
                className="hover:text-emerald-950 p-0.5"
                aria-label="Remove sort filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* 3. Slide-up Filter Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop Overlay */}
          <div
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative z-10 w-full max-h-[88vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="px-5 pt-3 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900 leading-tight">
                    Filter &amp; Sort
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Refine products to find exactly what you need
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetAll}
                  className="text-xs font-semibold text-neutral-500 hover:text-rose-600 px-2 py-1 rounded-lg"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Filter Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Section: Sort By */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                  Sort Listings
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "Newest", value: "newest" },
                    { label: "Price: Low", value: "price-asc" },
                    { label: "Price: High", value: "price-desc" },
                  ].map((s) => {
                    const isSelected = (!draftSort && s.value === "newest") || draftSort === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setDraftSort(s.value)}
                        className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all ${
                          isSelected
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Campus Location */}
              <div className="space-y-2.5 pt-1 border-t border-neutral-100">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Campus Location
                  </span>
                  {draftCampus && (
                    <button
                      type="button"
                      onClick={() => setDraftCampus("")}
                      className="text-[11px] text-emerald-600 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDraftCampus("")}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      !draftCampus
                        ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                        : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100 font-medium"
                    }`}
                  >
                    <span>All Campuses</span>
                    {!draftCampus && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  {campuses.map((c) => {
                    const isSelected = draftCampus === c.slug;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDraftCampus(isSelected ? "" : c.slug)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100 font-medium"
                        }`}
                      >
                        <span className="truncate pr-1">{c.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Price Range */}
              <div className="space-y-2.5 pt-1 border-t border-neutral-100">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Price Range (₦)
                  </span>
                  {(draftMinPrice || draftMaxPrice) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftMinPrice("");
                        setDraftMaxPrice("");
                      }}
                      className="text-[11px] text-emerald-600 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </label>

                {/* Preset Chips */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Under ₦10k", min: "", max: "10000" },
                    { label: "₦10k - ₦30k", min: "10000", max: "30000" },
                    { label: "₦30k - ₦100k", min: "30000", max: "100000" },
                    { label: "Over ₦100k", min: "100000", max: "" },
                  ].map((p, idx) => {
                    const isSelected = draftMinPrice === p.min && draftMaxPrice === p.max;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDraftMinPrice("");
                            setDraftMaxPrice("");
                          } else {
                            setDraftMinPrice(p.min);
                            setDraftMaxPrice(p.max);
                          }
                        }}
                        className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                          isSelected
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Min / Max Inputs */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-neutral-500 mb-1 block font-medium">Min Price (₦)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 mb-1 block font-medium">Max Price (₦)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Condition */}
              <div className="space-y-2.5 pt-1 border-t border-neutral-100">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Item Condition
                  </span>
                  {draftCondition && (
                    <button
                      type="button"
                      onClick={() => setDraftCondition("")}
                      className="text-[11px] text-emerald-600 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "All Conditions", value: "" },
                    { label: "Brand New", value: "NEW" },
                    { label: "Like New", value: "USED_LIKE_NEW" },
                    { label: "Good Condition", value: "USED_GOOD" },
                    { label: "Fair Condition", value: "USED_FAIR" },
                  ].map((c) => {
                    const isSelected = draftCondition === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setDraftCondition(c.value)}
                        className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                          isSelected
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Seller Type */}
              <div className="space-y-2.5 pt-1 border-t border-neutral-100">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Seller Type
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "All Sellers", value: "" },
                    { label: "Student Sellers", value: "student" },
                    { label: "Guest Vendors", value: "guest" },
                  ].map((st) => {
                    const isSelected = draftSellerType === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => setDraftSellerType(st.value)}
                        className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                          isSelected
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100"
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Campus Vendors */}
              {vendors && vendors.length > 0 && (
                <div className="space-y-2.5 pt-1 border-t border-neutral-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      Student Storefronts
                    </span>
                    {draftVendor && (
                      <button
                        type="button"
                        onClick={() => setDraftVendor("")}
                        className="text-[11px] text-emerald-600 font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setDraftVendor("")}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        !draftVendor
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100 font-medium"
                      }`}
                    >
                      <span>All Storefronts</span>
                      {!draftVendor && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    {vendors.map((v) => {
                      const isSelected = draftVendor === v.slug;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setDraftVendor(isSelected ? "" : v.slug)}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100 font-medium"
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold block truncate">{v.storeName}</span>
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {v.campus?.name.split(" ")[0]}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Actions */}
            <div className="p-4 border-t border-neutral-200/80 bg-neutral-50/80 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAll}
                className="w-1/3 rounded-full text-xs font-bold h-11 border-neutral-200 text-neutral-700"
              >
                Reset All
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                className="w-2/3 rounded-full text-xs font-bold h-11 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
