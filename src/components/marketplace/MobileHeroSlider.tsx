"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Sparkles, Store, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlideItem {
  badge: {
    text: string;
    icon: React.ComponentType<{ className?: string }>;
    pillBg: string;
    pillText: string;
  };
  title: string;
  highlightText: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  imageSrc: string;
  imageAlt: string;
  bgGradient: string;
}

const slides: SlideItem[] = [
  {
    badge: {
      text: "Best Seller!",
      icon: Flame,
      pillBg: "bg-white/20",
      pillText: "text-amber-200",
    },
    title: "Discover Campus",
    highlightText: "Products!",
    description: "Buy & sell textbooks, drip & gadgets from verified peers.",
    buttonText: "Shop Now!",
    buttonHref: "/shop",
    imageSrc: "/images/hero-shopping-cart.png",
    imageAlt: "Shopping cart filled with campus products",
    bgGradient: "bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700",
  },
  {
    badge: {
      text: "Semester Rush",
      icon: Sparkles,
      pillBg: "bg-white/20",
      pillText: "text-amber-200",
    },
    title: "Up To 50% Off",
    highlightText: "Clearance!",
    description: "Hostel essentials, textbooks & sneakers at clearance prices.",
    buttonText: "View Deals!",
    buttonHref: "/shop?filter=sale",
    imageSrc: "/images/hero-shopping-items-transparent.png",
    imageAlt: "Curated student shopping items",
    bgGradient: "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500",
  },
  {
    badge: {
      text: "Student Sellers",
      icon: Store,
      pillBg: "bg-white/20",
      pillText: "text-emerald-200",
    },
    title: "Turn Your Drip Into",
    highlightText: "Income!",
    description: "Launch your verified student storefront in under 3 minutes.",
    buttonText: "Open Store!",
    buttonHref: "/vendor/register",
    imageSrc: "/images/hero-shopping-cart.png",
    imageAlt: "Student entrepreneur storefront cart",
    bgGradient: "bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700",
  },
];

export function MobileHeroSlider() {
  const [current, setCurrent] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  // Auto-play interval
  React.useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsPaused(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next slide
      setCurrent((prev) => (prev + 1) % slides.length);
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev slide
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    }

    setTouchStart(null);
    setTouchEnd(null);
    setIsPaused(false);
  };

  return (
    <div className="w-full">
      {/* Slider Viewport */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-lg shadow-emerald-950/10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Carousel Track */}
        <div
          className="flex transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, idx) => {
            const BadgeIcon = slide.badge.icon;
            return (
              <div
                key={idx}
                className={`min-w-full w-full ${slide.bgGradient} p-4 xs:p-5 text-white relative flex flex-col justify-between`}
              >
                {/* Background subtle ambient blob */}
                <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10 min-h-[160px] xs:min-h-[175px]">
                  {/* Left Column Text */}
                  <div className="w-[62%] space-y-1.5 xs:space-y-2 pr-1">
                    <span
                      className={`inline-flex items-center gap-1 ${slide.badge.pillBg} backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold ${slide.badge.pillText}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      {slide.badge.text}
                    </span>
                    <h2 className="text-lg xs:text-xl font-black leading-tight tracking-tight text-white">
                      {slide.title} <br />
                      <span className="text-amber-300">{slide.highlightText}</span>
                    </h2>
                    <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed font-normal">
                      {slide.description}
                    </p>
                    <div className="pt-1">
                      <Link href={slide.buttonHref}>
                        <Button
                          size="sm"
                          className="bg-white text-emerald-950 hover:bg-neutral-100 font-bold text-xs px-4 py-1.5 h-8 rounded-full shadow-md active:scale-95 transition-all"
                        >
                          {slide.buttonText}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Right Column Visual (Shopping Cart on Mobile) */}
                  <div className="w-[38%] h-32 xs:h-36 relative flex items-center justify-center shrink-0">
                    <Image
                      src={slide.imageSrc}
                      alt={slide.imageAlt}
                      fill
                      priority={idx === 0}
                      sizes="160px"
                      className="object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.28)]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Quick Left/Right Arrow Overlays */}
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/15 text-white/80 hover:bg-black/30 flex items-center justify-center backdrop-blur-xs transition-colors z-20"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/15 text-white/80 hover:bg-black/30 flex items-center justify-center backdrop-blur-xs transition-colors z-20"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${
              current === i
                ? "w-6 h-1.5 bg-emerald-500"
                : "w-1.5 h-1.5 bg-neutral-300 hover:bg-neutral-400"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
