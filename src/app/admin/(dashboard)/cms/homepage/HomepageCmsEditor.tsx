"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Truck,
  ShieldCheck,
  Check,
  ArrowRight,
  Monitor,
  Smartphone,
  Eye,
  ShoppingBag,
  Layers,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  initialSettings: Record<string, string>;
}

export function HomepageCmsEditor({ initialSettings }: Props) {
  const defaultValues = {
    announcement_bar:
      initialSettings.announcement_bar ||
      "🔥 BACK TO CAMPUS DEALS: Up to 40% OFF Laptops, Textbooks, and Dorm Essentials across all campuses!",
    hero_badge: initialSettings.hero_badge || "⚡ VERIFIED STUDENT MERCHANTS ONLY",
    hero_title: initialSettings.hero_title || "Latest Campus Gear & Essentials",
    hero_subtitle:
      initialSettings.hero_subtitle ||
      "Buy and sell textbooks, laptops, hostel appliances, and thrift streetwear directly from verified student vendors across UNILAG, UI, and OAU.",
    hero_cta_text: initialSettings.hero_cta_text || "Shop Campus Drops",
    flash_sale_badge: initialSettings.flash_sale_badge || "Semester Rush Deals",
    flash_sale_title: initialSettings.flash_sale_title || "Up To 50% Off Campus Essentials",
    flash_sale_subtitle:
      initialSettings.flash_sale_subtitle ||
      "Limited inventory discounts from graduating students wrapping up their clearance sales.",
    seller_promo_title:
      initialSettings.seller_promo_title || "Turn Your Drip or Skills Into Campus Income",
    seller_promo_subtitle:
      initialSettings.seller_promo_subtitle ||
      "Launch your storefront in under 3 minutes. Pick your storefront layout, upload items, and receive WhatsApp orders with zero listing fees.",
  };

  const [formData, setFormData] = useState(defaultValues);
  const [activeTab, setActiveTab] = useState<"all" | "announcement" | "hero" | "promo">("all");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateField = (field: keyof typeof defaultValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSuccess(false);
  };

  const handleReset = () => {
    if (window.confirm("Reset all fields back to default settings?")) {
      setFormData(defaultValues);
      setHasChanges(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/cms/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const announcementPresets = [
    "🔥 BACK TO CAMPUS DEALS: Up to 40% OFF Laptops, Textbooks, and Dorm Essentials across all campuses!",
    "⚡ SEMESTER FINALS CLEARANCE: Graduating seniors selling dorm gear at 50% discount!",
    "📦 FREE ON-CAMPUS PICKUP: Safe meetup zones now active at UNILAG, UI & OAU!",
    "📚 TEXTBOOK & COURSE PACK DROP: Verified study materials available directly from top seniors!",
  ];

  return (
    <div className="space-y-8">
      {/* Sticky Top Control & Navigation Bar */}
      <div className="sticky top-4 z-40 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "all"
                  ? "bg-emerald-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All Banners
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("announcement")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "announcement"
                  ? "bg-emerald-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Announcement
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hero")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "hero"
                  ? "bg-emerald-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Hero Header
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("promo")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "promo"
                  ? "bg-emerald-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Promo Cards
            </button>
          </div>

          {/* Viewport Preview Toggle */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`p-1.5 px-2.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                previewDevice === "desktop"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Preview Desktop Layout"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`p-1.5 px-2.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                previewDevice === "mobile"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Preview Mobile Layout"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2.5 justify-end">
          {hasChanges && (
            <span className="text-[11px] text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
              ● Unsaved Changes (Previewing Live)
            </span>
          )}

          {success && (
            <span className="text-[11px] text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Published to Homepage!
            </span>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs text-neutral-400 hover:text-white border-neutral-800"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 shadow-lg shadow-emerald-600/30 gap-1.5"
          >
            {saving ? (
              "Publishing..."
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Publish Changes</span>
              </>
            )}
          </Button>

          <Link
            href="/"
            target="_blank"
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Open Live Public Homepage"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* ========================================================= */}
        {/* 1. TOP ANNOUNCEMENT BANNER SECTION                         */}
        {/* ========================================================= */}
        {(activeTab === "all" || activeTab === "announcement") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  1. Top Announcement Bar (Global Ticker)
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Replicated exactly as it appears across the very top of all public marketplace pages.
                </p>
              </div>
              <Badge className="bg-neutral-800 text-neutral-300 border-neutral-700 text-[10px]">
                Instant Live Preview
              </Badge>
            </div>

            {/* LIVE PREVIEW CONTAINER */}
            <div className="rounded-2xl border-2 border-dashed border-amber-500/40 p-1.5 bg-neutral-950/80 shadow-md">
              <div className="bg-neutral-900 text-white text-xs py-2.5 px-4 rounded-xl flex items-center justify-between overflow-hidden shadow-inner">
                <div className="flex items-center gap-6 text-neutral-300 overflow-hidden">
                  <span className="hidden md:flex items-center gap-1.5 shrink-0">
                    <Truck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Free On-Campus Pickup Points</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300 font-semibold truncate">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{formData.announcement_bar}</span>
                  </span>
                  <span className="hidden lg:flex items-center gap-1.5 shrink-0 text-neutral-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>100% Student Verified Vendors</span>
                  </span>
                </div>
                <div className="shrink-0 text-white font-semibold text-xs ml-3 pl-3 border-l border-neutral-800">
                  <span>Become a Seller &rarr;</span>
                </div>
              </div>
            </div>

            {/* EDITABLE INPUTS & PRESETS */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <label className="text-xs font-bold text-neutral-200 block">
                Edit Ticker Announcement Text
              </label>
              <input
                type="text"
                value={formData.announcement_bar}
                onChange={(e) => updateField("announcement_bar", e.target.value)}
                placeholder="Enter alert text, promo discounts, or campus news..."
                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />

              <div className="pt-2">
                <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                  Quick Preset Suggestions (Click to apply immediately):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {announcementPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateField("announcement_bar", preset)}
                      className="text-[10px] text-neutral-300 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 rounded-lg px-2.5 py-1 text-left transition-colors truncate max-w-md"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. MAIN HERO HEADER & BANNER SLIDER REPLICA               */}
        {/* ========================================================= */}
        {(activeTab === "all" || activeTab === "hero") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  2. Hero Header Banner (NovaTrend Style)
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  The primary flagship banner that prospective student buyers and vendors see first.
                </p>
              </div>
              <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                Live Interactive Replica
              </Badge>
            </div>

            {/* LIVE HERO REPLICA CONTAINER */}
            <div
              className={`rounded-3xl border-2 border-dashed border-emerald-500/40 p-2 bg-neutral-950/90 shadow-xl transition-all ${
                previewDevice === "mobile" ? "max-w-md mx-auto" : "w-full"
              }`}
            >
              {previewDevice === "desktop" ? (
                /* DESKTOP HERO REPLICA */
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800/80 p-8 sm:p-10 text-white min-h-[360px] flex items-center">
                  {/* Glowing Ambient Radial Disc */}
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-400/10 to-transparent blur-2xl pointer-events-none" />

                  <div className="relative z-10 max-w-xl space-y-4">
                    {/* Badge Pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span>{formData.hero_badge}</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                      {formData.hero_title}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-lg">
                      {formData.hero_subtitle}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 h-9 rounded-xl shadow-md shadow-emerald-500/20"
                      >
                        {formData.hero_cta_text} &rarr;
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-xs font-semibold h-9 rounded-xl"
                      >
                        Browse Collections
                      </Button>
                      <span className="text-xs text-emerald-400 hover:underline cursor-pointer font-semibold ml-2">
                        Sell on Campus &rarr;
                      </span>
                    </div>
                  </div>

                  {/* Desktop Floating Badges & Visual Graphic */}
                  <div className="hidden md:flex flex-col items-center justify-center absolute right-12 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-emerald-500/30 to-teal-400/20 border border-emerald-400/30 flex items-center justify-center relative shadow-2xl">
                      <ShoppingBag className="w-16 h-16 text-emerald-300" />
                      <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-neutral-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg">
                        UP TO 50% OFF
                      </div>
                      <div className="absolute -bottom-3 bg-neutral-900/90 border border-neutral-700 text-white text-[10px] px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Fresh Campus Drops</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MOBILE HERO REPLICA (As seen on phone screen) */
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 p-4 space-y-3.5 text-white">
                  {/* Mobile Search Bar Mock */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-[11px] text-neutral-400 flex items-center gap-2">
                      <span>🔍 What are you looking for?</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                  </div>

                  {/* Mobile Slider Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-950 to-neutral-950 border border-emerald-500/30 p-4 space-y-2 relative overflow-hidden shadow-inner">
                    <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">
                      {formData.hero_badge}
                    </span>
                    <h3 className="text-base font-extrabold text-white leading-snug">
                      {formData.hero_title}
                    </h3>
                    <p className="text-[11px] text-neutral-300 line-clamp-2">
                      {formData.hero_subtitle}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <div className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[10px]">
                        {formData.hero_cta_text}
                      </div>
                      <span className="text-[10px] text-amber-300 font-bold">50% Clearance</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* EDITABLE HERO INPUTS */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-200 block mb-1">
                    Hero Badge Pill Tag
                  </label>
                  <input
                    type="text"
                    value={formData.hero_badge}
                    onChange={(e) => updateField("hero_badge", e.target.value)}
                    placeholder="e.g. ⚡ VERIFIED STUDENT MERCHANTS ONLY"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    The pill badge that appears right above the main title.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-200 block mb-1">
                    Primary CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.hero_cta_text}
                    onChange={(e) => updateField("hero_cta_text", e.target.value)}
                    placeholder="e.g. Shop Campus Drops"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Button that directs student buyers to the catalog.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-200 block mb-1">
                  Main Hero Headline
                </label>
                <input
                  type="text"
                  value={formData.hero_title}
                  onChange={(e) => updateField("hero_title", e.target.value)}
                  placeholder="e.g. Latest Campus Gear & Essentials"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-200 block mb-1">
                  Hero Subtitle & Supporting Paragraph
                </label>
                <textarea
                  rows={3}
                  value={formData.hero_subtitle}
                  onChange={(e) => updateField("hero_subtitle", e.target.value)}
                  placeholder="Describe your student marketplace community and benefits..."
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. DUAL PROMOTIONAL BANNERS SECTION                       */}
        {/* ========================================================= */}
        {(activeTab === "all" || activeTab === "promo") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                  3. Promotional Mid-Page Cards (Clearance & Seller Pitch)
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Replicas of the dual promotional cards on the homepage that drive flash sales and vendor onboarding.
                </p>
              </div>
              <Badge className="bg-orange-950 text-orange-300 border-orange-800 text-[10px]">
                Live Interactive Replica
              </Badge>
            </div>

            {/* DUAL CARDS PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CARD 1: FLASH SALE & COUNTDOWN REPLICA */}
              <div className="space-y-3">
                <div className="rounded-3xl border-2 border-dashed border-orange-500/40 p-2 bg-neutral-950/80">
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 text-white p-6 sm:p-7 flex flex-col justify-between min-h-[290px] shadow-lg shadow-orange-600/20">
                    <div className="space-y-2.5 relative z-10">
                      <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] uppercase font-extrabold tracking-wider text-white inline-block">
                        {formData.flash_sale_badge}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black leading-tight">
                        {formData.flash_sale_title}
                      </h3>
                      <p className="text-xs text-amber-100 line-clamp-2 max-w-sm">
                        {formData.flash_sale_subtitle}
                      </p>

                      {/* Live Countdown Timer Replica */}
                      <div className="flex items-center gap-1.5 pt-2">
                        <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-center min-w-[36px]">
                          <span className="font-extrabold text-xs">02</span>
                          <span className="block text-[7px] uppercase tracking-wider text-amber-200">Days</span>
                        </div>
                        <span>:</span>
                        <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-center min-w-[36px]">
                          <span className="font-extrabold text-xs">14</span>
                          <span className="block text-[7px] uppercase tracking-wider text-amber-200">Hours</span>
                        </div>
                        <span>:</span>
                        <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-center min-w-[36px]">
                          <span className="font-extrabold text-xs">38</span>
                          <span className="block text-[7px] uppercase tracking-wider text-amber-200">Mins</span>
                        </div>
                        <span>:</span>
                        <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-center min-w-[36px]">
                          <span className="font-extrabold text-xs">45</span>
                          <span className="block text-[7px] uppercase tracking-wider text-amber-200">Secs</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 relative z-10">
                      <div className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white text-neutral-950 font-bold text-xs shadow-md">
                        <span>Shop Flash Sale Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 1 Inputs */}
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Flash Sale Badge
                    </label>
                    <input
                      type="text"
                      value={formData.flash_sale_badge}
                      onChange={(e) => updateField("flash_sale_badge", e.target.value)}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Flash Sale Headline
                    </label>
                    <input
                      type="text"
                      value={formData.flash_sale_title}
                      onChange={(e) => updateField("flash_sale_title", e.target.value)}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Flash Sale Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.flash_sale_subtitle}
                      onChange={(e) => updateField("flash_sale_subtitle", e.target.value)}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: SELLER ONBOARDING PITCH REPLICA */}
              <div className="space-y-3">
                <div className="rounded-3xl border-2 border-dashed border-emerald-500/40 p-2 bg-neutral-950/80">
                  <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 text-white p-6 sm:p-7 flex flex-col justify-between min-h-[290px] shadow-lg">
                    <div className="space-y-2.5 relative z-10">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-block">
                        Student Seller Community
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black leading-tight">
                        {formData.seller_promo_title}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 max-w-sm">
                        {formData.seller_promo_subtitle}
                      </p>

                      <ul className="text-xs text-neutral-300 space-y-1.5 pt-1">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Zero upfront listing fees for student sellers</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Direct instant WhatsApp buyer communication</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-4 relative z-10">
                      <div className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md">
                        <span>Open a Free Storefront</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2 Inputs */}
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Seller Card Headline
                    </label>
                    <input
                      type="text"
                      value={formData.seller_promo_title}
                      onChange={(e) => updateField("seller_promo_title", e.target.value)}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Seller Card Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.seller_promo_subtitle}
                      onChange={(e) => updateField("seller_promo_subtitle", e.target.value)}
                      className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. TRUST & VALUE PROPOSITIONS BAR REPLICA                 */}
        {/* ========================================================= */}
        {activeTab === "all" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                4. Value Propositions & Trust Bar (Reference Layout)
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Displays directly below the Hero Banner to build immediate buyer and seller trust.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-neutral-800 p-2 bg-neutral-950/80">
              <div className="bg-white rounded-xl p-4 sm:p-5 text-neutral-900 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
                  <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 leading-tight">Free Campus Pickup</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Meet safely at designated gates</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 leading-tight">100% Student Verified</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Student IDs checked by admins</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 leading-tight">Direct WhatsApp Chat</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Instant deal negotiation</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 leading-tight">Escrow Protection</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Payment held until delivery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action Floating Bar */}
        <div className="sticky bottom-4 z-40 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 p-4 rounded-2xl shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            {success ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <Check className="w-4 h-4" /> Published to Homepage! Changes are live.
              </span>
            ) : hasChanges ? (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                You have unsaved changes in your live preview.
              </span>
            ) : (
              <span className="text-xs text-neutral-400">
                All sections synchronized with live marketplace.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-neutral-300 hover:text-white hover:underline flex items-center gap-1"
            >
              <span>View Live Storefront</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 h-10 shadow-lg shadow-emerald-600/30 gap-1.5"
            >
              {saving ? "Publishing..." : "Publish Homepage Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
