"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Flame, Sparkles, ShoppingBag } from "lucide-react";
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
      icon: ShoppingBag,
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
      {/* Slider Viewport (100% viewport width full bleed) */}
      <div
        className="relative w-full overflow-hidden shadow-xs"
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
                className={`min-w-full w-full ${slide.bgGradient} px-5 pt-4 pb-6 xs:px-6 xs:pt-5 xs:pb-7 sm:px-10 sm:py-9 md:px-16 md:py-14 text-white relative flex flex-col justify-between`}
              >
                {/* Background subtle ambient blob */}
                <div className="absolute -top-10 -right-10 w-44 h-44 sm:w-80 sm:h-80 md:w-[500px] md:h-[500px] rounded-full bg-white/10 blur-xl md:blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10 min-h-[160px] xs:min-h-[175px] sm:min-h-[300px] md:min-h-[420px]">
                  {/* Left Column Text */}
                  <div className="w-[62%] sm:w-[58%] md:w-[54%] space-y-1.5 xs:space-y-2 sm:space-y-3.5 md:space-y-5 pr-1 sm:pr-4 md:pr-6">
                    <span
                      className={`inline-flex items-center gap-1 sm:gap-1.5 ${slide.badge.pillBg} backdrop-blur-md px-2.5 py-0.5 sm:px-4 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-bold ${slide.badge.pillText}`}
                    >
                      <BadgeIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4" />
                      {slide.badge.text}
                    </span>
                    <h2 className="text-lg xs:text-xl sm:text-3xl md:text-5xl lg:text-[54px] font-black leading-tight sm:leading-tight md:leading-[1.08] tracking-tight text-white">
                      {slide.title} <br />
                      <span className="text-amber-300">{slide.highlightText}</span>
                    </h2>
                    <p className="text-[11px] sm:text-sm md:text-base lg:text-lg text-white/95 line-clamp-2 sm:line-clamp-3 md:line-clamp-none leading-relaxed font-normal max-w-xl">
                      {slide.description}
                    </p>
                    <div className="pt-1 sm:pt-2 md:pt-3">
                      <Link href={slide.buttonHref}>
                        <Button
                          size="sm"
                          className="bg-white text-emerald-950 hover:bg-neutral-100 font-bold text-xs sm:text-sm md:text-base px-4 py-1.5 sm:px-6 sm:py-2.5 sm:h-10 md:h-12 md:px-8 rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
                        >
                          {slide.buttonText}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Right Column Visual (Shopping Cart / Promo image) */}
                  <div className="w-[38%] sm:w-[42%] md:w-[46%] h-32 xs:h-36 sm:h-64 md:h-[360px] relative flex items-center justify-center shrink-0">
                    <Image
                      src={slide.imageSrc}
                      alt={slide.imageAlt}
                      fill
                      priority={idx === 0}
                      sizes="(max-width: 640px) 160px, (max-width: 1024px) 440px, 500px"
                      className="object-contain filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.32)]"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overlay Pagination Dots */}
        <div className="absolute bottom-2 sm:bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1.5 sm:gap-2.5 pointer-events-none">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full pointer-events-auto cursor-pointer ${
                current === i
                  ? "w-5 sm:w-8 md:w-10 h-1.5 sm:h-2 md:h-2.5 bg-white shadow-xs"
                  : "w-1.5 sm:w-2 md:w-2.5 h-1.5 sm:h-2 md:h-2.5 bg-white/45 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
