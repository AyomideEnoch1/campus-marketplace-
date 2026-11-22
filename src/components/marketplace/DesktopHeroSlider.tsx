"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DesktopSlide {
  id: string;
  title: string;
  highlightText: string;
  subtitle: string;
  description: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  tertiaryLink?: {
    label: string;
    href: string;
  };
  imageSrc: string;
  imageAlt: string;
  discGradient: string;
  discBorder: string;
  ambientGlow: string;
  discountBadge: {
    top: string;
    main: string;
    bottom: string;
    accentColor: string;
  };
  pillCard: {
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
  };
}

const desktopSlides: DesktopSlide[] = [
  {
    id: "campus-gear",
    title: "Latest Campus",
    highlightText: "Gear & Essentials",
    subtitle: "Best Quality, Student-Friendly Prices!",
    description:
      "Buy and sell textbooks, laptops, smartphones, hostel appliances, and thrift streetwear directly from verified student vendors across UNILAG, UI, OAU, FUTA, and 50+ Nigerian universities.",
    primaryCta: {
      label: "Shop Now",
      href: "/shop",
    },
    secondaryCta: {
      label: "Browse Collection",
      href: "/shop",
    },
    tertiaryLink: {
      label: "Sell on Campus →",
      href: "/vendor/register",
    },
    imageSrc: "/images/hero-shopping-items-transparent.png",
    imageAlt: "Curated campus gear: laptop, headphones, backpack, sneakers, and gadgets",
    discGradient: "from-emerald-500 via-teal-400 to-emerald-200",
    discBorder: "border-emerald-400/30",
    ambientGlow: "bg-emerald-100/40",
    discountBadge: {
      top: "UP TO",
      main: "50%",
      bottom: "OFF",
      accentColor: "text-emerald-400",
    },
    pillCard: {
      icon: "⚡",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      title: "Fresh Campus Drops",
      subtitle: "Updated hourly by student sellers",
    },
  },
  {
    id: "semester-deals",
    title: "Up To 50% Off",
    highlightText: "Semester Clearance",
    subtitle: "Unbeatable Student-to-Student Discounts!",
    description:
      "Save big on campus essentials! Snag verified laptops, graphing calculators, mini fridges, course study packs, and sneakers at clearance prices before they sell out.",
    primaryCta: {
      label: "Explore Deals",
      href: "/shop?deals=true",
    },
    secondaryCta: {
      label: "Browse Textbooks",
      href: "/shop?category=books-academics",
    },
    tertiaryLink: {
      label: "Sell on Campus →",
      href: "/vendor/register",
    },
    imageSrc: "/images/hero-shopping-cart.png",
    imageAlt: "Shopping cart packed with student deals",
    discGradient: "from-amber-500 via-orange-400 to-rose-400",
    discBorder: "border-amber-400/30",
    ambientGlow: "bg-amber-100/40",
    discountBadge: {
      top: "HOT",
      main: "50%",
      bottom: "DEALS",
      accentColor: "text-amber-400",
    },
    pillCard: {
      icon: "🔥",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      title: "Hot Student Deals",
      subtitle: "Verified bargains from graduating peers",
    },
  },
  {
    id: "student-sellers",
    title: "Turn Your Drip Into",
    highlightText: "Campus Income",
    subtitle: "Sell Directly to Verified Students on Campus!",
    description:
      "Got textbooks you no longer need, extra electronics, or looking to sell thrift clothes? Launch your verified student storefront in under 3 minutes with zero upfront fees.",
    primaryCta: {
      label: "Open Store",
      href: "/vendor/register",
    },
    secondaryCta: {
      label: "Vendor Guidelines",
      href: "/vendor-guidelines",
    },
    tertiaryLink: {
      label: "Browse Stores →",
      href: "/vendors",
    },
    imageSrc: "/images/hero-student-shopper.png",
    imageAlt: "Student entrepreneur on campus",
    discGradient: "from-teal-600 via-emerald-500 to-cyan-400",
    discBorder: "border-teal-400/30",
    ambientGlow: "bg-teal-100/40",
    discountBadge: {
      top: "START",
      main: "FREE",
      bottom: "TODAY",
      accentColor: "text-teal-300",
    },
    pillCard: {
      icon: "🏪",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      title: "Student Seller Hub",
      subtitle: "Fast peer-to-peer campus meetups",
    },
  },
];

export function DesktopHeroSlider({
  customHeroBadge,
  customHeroTitle,
  customHeroSubtitle,
  customHeroCta,
}: {
  customHeroBadge?: string;
  customHeroTitle?: string;
  customHeroSubtitle?: string;
  customHeroCta?: string;
} = {}) {
  const slides = React.useMemo(() => {
    const list = [...desktopSlides];
    if (customHeroTitle || customHeroSubtitle || customHeroCta) {
      const words = (customHeroTitle || "").trim().split(" ");
      const mid = Math.min(2, Math.max(1, Math.floor(words.length / 2)));
      list[0] = {
        ...list[0],
        title: customHeroTitle ? words.slice(0, mid).join(" ") : list[0].title,
        highlightText: customHeroTitle ? words.slice(mid).join(" ") : list[0].highlightText,
        description: customHeroSubtitle || list[0].description,
        primaryCta: {
          ...list[0].primaryCta,
          label: customHeroCta || list[0].primaryCta.label,
        },
      };
    }
    return list;
  }, [customHeroTitle, customHeroSubtitle, customHeroCta]);

  const [current, setCurrent] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const total = slides.length;
  const slide = slides[current];

  const changeSlide = React.useCallback(
    (nextIdx: number) => {
      if (isTransitioning || nextIdx === current) return;
      setIsTransitioning(true);
      setCurrent(nextIdx);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    },
    [isTransitioning, current]
  );

  const prevSlide = React.useCallback(() => {
    changeSlide((current - 1 + total) % total);
  }, [current, total, changeSlide]);

  const nextSlide = React.useCallback(() => {
    changeSlide((current + 1) % total);
  }, [current, total, changeSlide]);

  // Auto-play interval
  React.useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      changeSlide((current + 1) % total);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, current, total, changeSlide]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);

  return (
    <section className="relative overflow-hidden bg-white pt-4 pb-8 lg:pb-12">
      {/* 1. VISIBLE FULL-BLEED VECTOR PATTERNS BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Crisp Vector Dot Matrix Grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-65 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="hero-grid-pattern"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="18" cy="18" r="1.8" fill="currentColor" />
            </pattern>
            {/* Soft radial fade vignette so center/edges are balanced */}
            <radialGradient id="fade-mask" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="65%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0.1" />
            </radialGradient>
            <mask id="radial-fade">
              <rect width="100%" height="100%" fill="url(#fade-mask)" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#hero-grid-pattern)"
            mask="url(#radial-fade)"
          />
        </svg>

        {/* Prominent Geometric Concentric Orbital Arcs behind right visual */}
        <svg
          className="absolute -top-16 -right-16 w-[740px] h-[740px] pointer-events-none"
          viewBox="0 0 740 740"
          fill="none"
        >
          {/* Outer dashed orbit with node */}
          <circle cx="370" cy="370" r="330" stroke="#10b981" strokeWidth="2" strokeDasharray="10 14" opacity="0.35" />
          <circle cx="700" cy="370" r="6" fill="#10b981" opacity="0.8" />
          {/* Middle dashed orbit with node */}
          <circle cx="370" cy="370" r="270" stroke="#14b8a6" strokeWidth="2" strokeDasharray="6 8" opacity="0.4" />
          <circle cx="210" cy="180" r="5" fill="#14b8a6" opacity="0.8" />
          {/* Inner orbit */}
          <circle cx="370" cy="370" r="215" stroke="#059669" strokeWidth="1.5" strokeDasharray="5 7" opacity="0.4" />
        </svg>

        {/* Distinct Vector Wave Ribbon (Top Left behind headline) */}
        <svg
          className="absolute top-8 left-8 w-36 h-16 text-emerald-500 opacity-60 -rotate-6"
          viewBox="0 0 140 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <path d="M10 20 C 35 5, 55 35, 80 20 C 105 5, 120 35, 135 20" />
        </svg>

        {/* Top-Right Secondary Geometric Wave */}
        <svg
          className="absolute top-1/2 left-[50%] w-28 h-12 text-teal-500 opacity-45 rotate-12"
          viewBox="0 0 120 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M5 15 Q 30 0, 60 15 T 115 15" />
        </svg>

        {/* High-visibility Geometric Cross / Plus Marks */}
        <svg
          className="absolute top-20 left-[42%] w-5 h-5 text-emerald-600 opacity-70"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="10" y1="2" x2="10" y2="18" />
          <line x1="2" y1="10" x2="18" y2="10" />
        </svg>

        <svg
          className="absolute bottom-16 left-[20%] w-4 h-4 text-slate-500 opacity-70"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="10" y1="2" x2="10" y2="18" />
          <line x1="2" y1="10" x2="18" y2="10" />
        </svg>

        <svg
          className="absolute bottom-28 right-[46%] w-4 h-4 text-emerald-600 opacity-60"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="10" y1="2" x2="10" y2="18" />
          <line x1="2" y1="10" x2="18" y2="10" />
        </svg>

        {/* Distinct 4-Point Geometric Sparkles */}
        <svg
          className="absolute top-24 left-[54%] w-6 h-6 text-emerald-500 opacity-75 animate-pulse"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>

        <svg
          className="absolute bottom-24 left-[10%] w-5 h-5 text-amber-500 opacity-70"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>

        {/* Geometric Corner Accent Rings (Top Left) */}
        <svg
          className="absolute -top-10 -left-10 w-44 h-44 text-emerald-400/30 pointer-events-none"
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="80" cy="80" r="45" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className="relative py-4 sm:py-6 lg:py-8 select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >

          {/* Decorative subtle ambient accents seamlessly blended with white */}
          <div
            className={`absolute top-0 right-12 w-[420px] h-[420px] ${slide.ambientGlow} rounded-full blur-3xl pointer-events-none -z-0 transition-colors duration-700 opacity-50`}
          />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-50/60 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-8 items-center relative z-10 min-h-[460px] xl:min-h-[520px]">
            {/* Left Column: Headline, Description & CTAs (Tight Proximity to Visual) */}
            <div
              key={`text-${current}`}
              className="lg:col-span-7 xl:col-span-7 space-y-5 lg:space-y-6 animate-in fade-in duration-500"
            >
              {/* Main Headline */}
              <div className="space-y-2 max-w-xl xl:max-w-2xl">
                <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-neutral-950 tracking-tight leading-[1.08]">
                  {slide.title} <br />
                  <span className="text-emerald-500">{slide.highlightText}</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-neutral-500 font-medium tracking-tight">
                  {slide.subtitle}
                </p>
              </div>

              {/* Short Description */}
              <p className="text-sm lg:text-base text-neutral-600 leading-relaxed font-normal max-w-lg xl:max-w-xl">
                {slide.description}
              </p>

              {/* Dual CTA Buttons */}
              <div className="flex items-center gap-3.5 pt-1">
                <Link href={slide.primaryCta.href}>
                  <Button
                    size="lg"
                    className="rounded-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-7 py-3 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
                  >
                    {slide.primaryCta.label} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href={slide.secondaryCta.href}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border border-neutral-300 hover:border-neutral-900 text-neutral-900 font-bold px-6 py-3 bg-white hover:bg-neutral-50 hover:-translate-y-0.5 active:scale-95 transition-all text-sm sm:text-base cursor-pointer shadow-2xs"
                  >
                    {slide.secondaryCta.label}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Visual with Circular Spotlight Disc (Brought in Close) */}
            <div className="lg:col-span-5 xl:col-span-5 relative flex items-center justify-center lg:justify-start lg:-ml-4 xl:-ml-6">
              {/* Visual Container */}
              <div className="relative w-[380px] sm:w-[440px] lg:w-[460px] xl:w-[500px] h-[420px] lg:h-[480px] xl:h-[520px] flex items-center justify-center shrink-0">
                {/* Vibrant Circular Gradient Spotlight Disc */}
                <div
                  className={`absolute w-[340px] h-[340px] lg:w-[380px] lg:h-[380px] xl:w-[430px] xl:h-[430px] rounded-full bg-gradient-to-tr ${slide.discGradient} opacity-90 shadow-2xl shadow-emerald-500/20 -z-0 transition-all duration-700 hover:scale-105`}
                />

                {/* Decorative secondary ring */}
                <div
                  className={`absolute w-[380px] h-[380px] lg:w-[420px] lg:h-[420px] xl:w-[475px] xl:h-[475px] rounded-full border ${slide.discBorder} -z-0 pointer-events-none transition-colors duration-700`}
                />

                {/* Floating Circular Discount Badge */}
                <div
                  key={`badge-${current}`}
                  className="absolute top-4 right-4 xl:top-6 xl:right-6 2xl:right-8 z-20 w-22 h-22 xl:w-24 xl:h-24 rounded-full bg-neutral-950 text-white flex flex-col items-center justify-center shadow-xl border-2 border-white/20 transform rotate-12 hover:rotate-0 hover:scale-110 transition-all cursor-pointer animate-in zoom-in-95 duration-500"
                >
                  <span
                    className={`text-[10px] xl:text-xs font-semibold uppercase tracking-wider ${slide.discountBadge.accentColor}`}
                  >
                    {slide.discountBadge.top}
                  </span>
                  <span className="text-lg xl:text-xl font-black leading-tight">
                    {slide.discountBadge.main}
                  </span>
                  <span className="text-[9px] xl:text-[10px] font-bold text-neutral-300">
                    {slide.discountBadge.bottom}
                  </span>
                </div>

                {/* Foreground Product Composition (Enlarged Scale) */}
                <div
                  key={`image-${current}`}
                  className="relative z-10 w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 scale-105 xl:scale-110"
                >
                  <Image
                    src={slide.imageSrc}
                    alt={slide.imageAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 60vw, 850px"
                    className="object-contain filter drop-shadow-[0_28px_50px_rgba(0,0,0,0.22)] hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Floating Circular "SELL" Badge (Strategically at Bottom-Left of Hero Visual) */}
                <Link
                  href="/vendor/register"
                  className="absolute bottom-6 left-2 xl:bottom-8 xl:left-0 z-20 w-20 h-20 xl:w-22 xl:h-22 rounded-full bg-neutral-950 text-white flex flex-col items-center justify-center shadow-2xl border-2 border-emerald-400/40 transform -rotate-12 hover:rotate-0 hover:scale-110 hover:border-emerald-400 transition-all cursor-pointer group"
                  title="Sell on Campus - Start Free"
                >
                  <span className="text-[9px] xl:text-[10px] font-bold uppercase tracking-wider text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    START
                  </span>
                  <span className="text-base xl:text-lg font-black leading-tight tracking-wide text-white">
                    SELL
                  </span>
                  <span className="text-[8px] xl:text-[9px] font-bold text-neutral-300 uppercase tracking-tight">
                    FREE
                  </span>
                </Link>

                {/* Interactive Carousel Navigation Dots (Clean, without arrows) */}
                <div className="absolute bottom-3 right-4 xl:bottom-5 xl:right-6 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200/80 shadow-md">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => changeSlide(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        current === i
                          ? "w-6 h-2 bg-emerald-500"
                          : "w-2 h-2 bg-neutral-300 hover:bg-neutral-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
