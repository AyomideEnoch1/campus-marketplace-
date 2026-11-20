"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";

interface HorizontalProductRowProps {
  title?: string;
  subtitle?: string;
  products: any[];
}

export function HorizontalProductRow({
  title = "Trending Campus Drops",
  subtitle = "Popular student gear, textbooks & fashion right now",
  products,
}: HorizontalProductRowProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [products]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = Math.max(300, scrollContainerRef.current.clientWidth * 0.75);
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-3 mb-8 bg-neutral-50/60 p-4 sm:p-5 rounded-3xl border border-neutral-200/70 shadow-2xs w-full max-w-full overflow-hidden min-w-0">
      {/* Row Header with navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>

        {/* Scroll Arrows for Desktop */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              canScrollLeft
                ? "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer shadow-xs"
                : "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              canScrollRight
                ? "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer shadow-xs"
                : "bg-neutral-100 border-neutral-200 text-neutral-300 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Rail of Product Cards */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="w-full max-w-full min-w-0 flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 -mx-2 px-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={`row-${product.id}`}
            className="w-[160px] xs:w-[175px] sm:w-[200px] md:w-[215px] shrink-0 snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
