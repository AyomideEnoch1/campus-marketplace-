"use client";

import * as React from "react";
import Image from "next/image";
import { SmartBackButton } from "@/components/layout/SmartBackButton";

export const SHOP_HERO_SLIDES = [
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

export function ShopHeroBanner() {
  const [currentSlide, setCurrentSlide] = React.useState<number>(0);
  const [isSliderHovered, setIsSliderHovered] = React.useState<boolean>(false);

  // Auto-play slider (5 seconds interval, pauses on hover)
  React.useEffect(() => {
    if (isSliderHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SHOP_HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isSliderHovered]);

  return (
    <div
      className="relative w-full h-[240px] xs:h-[270px] sm:h-[320px] md:h-[350px] lg:h-[380px] overflow-hidden bg-neutral-900 select-none"
      onMouseEnter={() => setIsSliderHovered(true)}
      onMouseLeave={() => setIsSliderHovered(false)}
    >
      {/* Floating Smart Back Button */}
      <div className="absolute top-3 left-3 sm:top-5 sm:left-6 z-30">
        <SmartBackButton
          fallbackUrl="/"
          fallbackLabel="Home"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-black/45 hover:bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 transition-all shadow-md"
        />
      </div>

      {SHOP_HERO_SLIDES.map((slide, idx) => {
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
              className="object-cover object-center brightness-[0.72] contrast-[1.05]"
            />

            {/* Ambient Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70 pointer-events-none" />

            {/* Giant Centered Display Typography (Matches Home Page Reference Design) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <h1 className="text-white text-[56px] xs:text-[72px] sm:text-[95px] md:text-[120px] lg:text-[145px] font-black tracking-tight leading-none drop-shadow-md opacity-95">
                {slide.title}
              </h1>
              <p className="text-white/85 text-[11px] sm:text-xs md:text-sm lg:text-base font-semibold tracking-widest uppercase mt-2 drop-shadow-sm">
                {slide.subtitle}
              </p>
            </div>
          </div>
        );
      })}

      {/* Minimal Bottom Indicators (Matches Home Page Reference Design) */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SHOP_HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              idx === currentSlide
                ? "w-6 sm:w-8 bg-emerald-500 shadow-sm"
                : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
