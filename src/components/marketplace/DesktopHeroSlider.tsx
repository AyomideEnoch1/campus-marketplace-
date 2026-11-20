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
      <div className="w-[94%] max-w-[1600px] mx-auto">
        <div
          className="relative bg-white py-4 sm:py-6 lg:py-8 select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Decorative subtle ambient accents seamlessly blended with white */}
          <div
            className={`absolute top-0 right-1/4 w-[460px] h-[460px] ${slide.ambientGlow} rounded-full blur-3xl pointer-events-none -z-0 transition-colors duration-700 opacity-50`}
          />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-50/60 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center relative z-10 min-h-[520px] xl:min-h-[620px]">
            {/* Left Column: Headline, Description & CTAs */}
            <div
              key={`text-${current}`}
              className="lg:col-span-6 xl:col-span-5 space-y-6 lg:space-y-8 animate-in fade-in duration-500"
            >
              {/* Main Headline */}
              <div>
                <h1 className="text-4xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-neutral-950 tracking-tight leading-[1.08]">
                  {slide.title} <br />
                  <span className="text-emerald-500">{slide.highlightText}</span>
                </h1>
                <p className="font-serif italic text-neutral-500 text-lg sm:text-xl lg:text-2xl mt-2 tracking-normal">
                  {slide.subtitle}
                </p>
              </div>

              {/* Short Description */}
              <p className="text-sm lg:text-base xl:text-lg text-neutral-600 leading-relaxed font-normal max-w-lg min-h-[64px]">
                {slide.description}
              </p>

              {/* Dual CTA Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Link href={slide.primaryCta.href}>
                  <Button
                    size="lg"
                    className="rounded-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-7 py-3.5 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 transition-all text-sm sm:text-base cursor-pointer"
                  >
                    {slide.primaryCta.label} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href={slide.secondaryCta.href}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-2 border-neutral-300 hover:border-neutral-900 text-neutral-900 font-bold px-6 py-3.5 bg-white hover:bg-neutral-50 hover:-translate-y-0.5 transition-all text-sm sm:text-base cursor-pointer"
                  >
                    {slide.secondaryCta.label}
                  </Button>
                </Link>
              </div>

              {/* Tertiary Seller / Partner On-Ramp (Presentable & Elegantly Positioned) */}
              {slide.tertiaryLink && (
                <div className="pt-1">
                  <Link
                    href={slide.tertiaryLink.href}
                    className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-neutral-100/80 hover:bg-emerald-50 border border-neutral-200/90 hover:border-emerald-300 transition-all text-xs text-neutral-600 hover:text-emerald-900 group shadow-2xs cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform shrink-0" />
                    <span className="text-neutral-500 font-medium">
                      {slide.id === "student-sellers" ? "Looking for vendors?" : "Have items to declutter or sell?"}
                    </span>
                    <span className="font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-0.5">
                      {slide.tertiaryLink.label.replace(" →", "")}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right Column: Hero Visual with Circular Spotlight Disc (Enlarged) */}
            <div className="lg:col-span-6 xl:col-span-7 relative flex items-center justify-center">
              {/* Visual Container */}
              <div className="relative w-full h-[500px] lg:h-[560px] xl:h-[640px] 2xl:h-[700px] flex items-center justify-center">
                {/* Vibrant Circular Gradient Spotlight Disc (A lot bigger) */}
                <div
                  className={`absolute w-[420px] h-[420px] lg:w-[480px] lg:h-[480px] xl:w-[560px] xl:h-[560px] 2xl:w-[640px] 2xl:h-[640px] rounded-full bg-gradient-to-tr ${slide.discGradient} opacity-90 shadow-2xl shadow-emerald-500/20 -z-0 transition-all duration-700 hover:scale-105`}
                />

                {/* Decorative secondary ring */}
                <div
                  className={`absolute w-[460px] h-[460px] lg:w-[530px] lg:h-[530px] xl:w-[620px] xl:h-[620px] 2xl:w-[700px] 2xl:h-[700px] rounded-full border ${slide.discBorder} -z-0 pointer-events-none transition-colors duration-700`}
                />

                {/* Floating Circular Discount Badge */}
                <div
                  key={`badge-${current}`}
                  className="absolute top-4 right-4 xl:top-6 xl:right-8 2xl:right-12 z-20 w-22 h-22 xl:w-24 xl:h-24 rounded-full bg-neutral-950 text-white flex flex-col items-center justify-center shadow-xl border-2 border-white/20 transform rotate-12 hover:rotate-0 hover:scale-110 transition-all cursor-pointer animate-in zoom-in-95 duration-500"
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

                {/* Interactive Carousel Navigation Dots (Clean, without arrows) */}
                <div className="absolute bottom-3 right-4 xl:bottom-5 xl:right-8 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200/80 shadow-md">
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
