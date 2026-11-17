"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center relative z-10 min-h-[460px]">
            {/* Left Column: Headline, Description & CTAs */}
            <div
              key={`text-${current}`}
              className="lg:col-span-7 xl:col-span-7 space-y-6 lg:space-y-8 animate-in fade-in duration-500"
            >
              {/* Main Headline */}
              <div>
                <h1 className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-[70px] font-black text-neutral-950 tracking-tight leading-[1.06]">
                  {slide.title} <br />
                  <span className="text-emerald-500">{slide.highlightText}</span>
                </h1>
                <p className="font-serif italic text-neutral-500 text-lg sm:text-xl lg:text-2xl mt-2 tracking-normal">
                  {slide.subtitle}
                </p>
              </div>

              {/* Short Description */}
              <p className="text-base lg:text-lg text-neutral-600 leading-relaxed font-normal max-w-xl min-h-[72px]">
                {slide.description}
              </p>

              {/* Dual CTA Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Link href={slide.primaryCta.href}>
                  <Button
                    size="lg"
                    className="rounded-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3.5 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 transition-all text-sm sm:text-base cursor-pointer"
                  >
                    {slide.primaryCta.label} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href={slide.secondaryCta.href}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-2 border-neutral-300 hover:border-neutral-900 text-neutral-900 font-bold px-7 py-3.5 bg-white hover:bg-neutral-50 hover:-translate-y-0.5 transition-all text-sm sm:text-base cursor-pointer"
                  >
                    {slide.secondaryCta.label}
                  </Button>
                </Link>
                {slide.tertiaryLink && (
                  <Link
                    href={slide.tertiaryLink.href}
                    className="ml-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 cursor-pointer"
                  >
                    {slide.tertiaryLink.label}
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column: Hero Visual with Circular Spotlight Disc, Floating Badges, and Slider Nav */}
            <div className="lg:col-span-5 xl:col-span-5 relative flex items-center justify-center">
              {/* Visual Container */}
              <div className="relative w-full h-[440px] xl:h-[500px] 2xl:h-[540px] flex items-center justify-center">
                {/* Vibrant Circular Gradient Spotlight Disc */}
                <div
                  className={`absolute w-[360px] h-[360px] xl:w-[420px] xl:h-[420px] rounded-full bg-gradient-to-tr ${slide.discGradient} opacity-90 shadow-2xl shadow-emerald-500/20 -z-0 transition-all duration-700 hover:scale-105`}
                />

                {/* Decorative secondary ring */}
                <div
                  className={`absolute w-[390px] h-[390px] xl:w-[460px] xl:h-[460px] rounded-full border ${slide.discBorder} -z-0 pointer-events-none transition-colors duration-700`}
                />

                {/* Floating Circular Discount Badge */}
                <div
                  key={`badge-${current}`}
                  className="absolute top-4 right-2 xl:top-6 xl:right-4 z-20 w-20 h-20 xl:w-22 xl:h-22 rounded-full bg-neutral-950 text-white flex flex-col items-center justify-center shadow-xl border-2 border-white/20 transform rotate-12 hover:rotate-0 hover:scale-110 transition-all cursor-pointer animate-in zoom-in-95 duration-500"
                >
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wider ${slide.discountBadge.accentColor}`}
                  >
                    {slide.discountBadge.top}
                  </span>
                  <span className="text-base xl:text-lg font-black leading-tight">
                    {slide.discountBadge.main}
                  </span>
                  <span className="text-[8px] font-bold text-neutral-300">
                    {slide.discountBadge.bottom}
                  </span>
                </div>

                {/* Foreground Product Composition */}
                <div
                  key={`image-${current}`}
                  className="relative z-10 w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500"
                >
                  <Image
                    src={slide.imageSrc}
                    alt={slide.imageAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 50vw, 650px"
                    className="object-contain filter drop-shadow-[0_25px_45px_rgba(0,0,0,0.20)] hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Floating Pill Card */}
                <div
                  key={`pill-${current}`}
                  className="absolute bottom-4 left-0 xl:bottom-6 xl:left-2 z-20 bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2.5 hover:-translate-y-0.5 transition-all animate-in slide-in-from-bottom-2 duration-500"
                >
                  <div
                    className={`w-8 h-8 rounded-xl ${slide.pillCard.iconBg} ${slide.pillCard.iconColor} flex items-center justify-center font-bold text-sm`}
                  >
                    {slide.pillCard.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900 leading-tight">
                      {slide.pillCard.title}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {slide.pillCard.subtitle}
                    </p>
                  </div>
                </div>

                {/* Interactive Carousel Navigation Pill Controls */}
                <div className="absolute bottom-4 right-0 xl:bottom-6 xl:right-2 z-30 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-neutral-200/80 shadow-lg">
                  {/* Clickable Dots */}
                  <div className="flex items-center gap-1.5">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => changeSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                          current === i
                            ? "w-5 h-2 bg-emerald-500"
                            : "w-2 h-2 bg-neutral-300 hover:bg-neutral-400"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="h-3.5 w-px bg-neutral-200 mx-0.5" />

                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Next slide"
                    className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-700 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
