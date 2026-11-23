"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  MessageCircle,
  ShieldCheck,
  Share2,
  Check,
  Sparkles,
  Star,
  CheckCircle2,
  MessageSquare,
  Clock,
  Smile,
  GraduationCap,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GridLayout } from "./layouts/GridLayout";
import { ListLayout } from "./layouts/ListLayout";
import { ShowcaseLayout } from "./layouts/ShowcaseLayout";
import { LookbookLayout } from "./layouts/LookbookLayout";
import { formatDate } from "@/lib/utils";

interface StorefrontRendererProps {
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    storeDescription?: string | null;
    logo?: string | null;
    banner?: string | null;
    layout: string;
    brandColor?: string | null;
    whatsapp?: string | null;
    faculty?: string | null;
    department?: string | null;
    sellerType?: string;
    isRegisteredBusiness?: boolean;
    isTrustedSeller?: boolean;
    businessAddress?: string | null;
    status: string;
    campus?: { name: string; slug: string; city: string };
    sellerAvgRating?: number;
    sellerReviewCount?: number;
    completedOrdersCount?: number;
    communicationAvg?: number;
    punctualityAvg?: number;
    behaviorAvg?: number;
  };
  products: any[];
  recentReviews?: any[];
  isPreview?: boolean;
}

export function StorefrontRenderer({
  vendor,
  products,
  recentReviews = [],
  isPreview = false,
}: StorefrontRendererProps) {
  const [copied, setCopied] = React.useState(false);
  const brandColor = vendor.brandColor || "#059669";
  const layout = vendor.layout || "grid";

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: vendor.storeName,
          text: `Check out ${vendor.storeName} on ọjà!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1. STORE HEADER BANNER */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 lg:h-72 bg-neutral-900 overflow-hidden">
        {/* Back to Overview button (only shown in preview/customizer mode) */}
        {isPreview && (
          <div className="absolute top-4 left-4 z-20">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-950 text-white text-xs font-bold backdrop-blur-md shadow-lg border border-white/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Overview</span>
            </Link>
          </div>
        )}

        {vendor.banner ? (
          <Image
            src={vendor.banner}
            alt={vendor.storeName}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full opacity-90"
            style={{
              background: `linear-gradient(135deg, ${brandColor} 0%, #0F172A 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      </div>

      {/* 2. STORE METADATA BAR (Positioned below the banner, with only the logo overlapping) */}
      <div className="container mx-auto px-4">
        <div className="pb-8 border-b border-neutral-100 space-y-4">
          {/* Top Row: Floating Logo & Action CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 md:-mt-20">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white overflow-hidden shadow-xl bg-white shrink-0 z-10">
              {vendor.logo ? (
                <img
                  src={vendor.logo}
                  alt={vendor.storeName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {vendor.storeName[0]}
                </div>
              )}
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Link
                href={`/messages?vendor=${vendor.slug || vendor.id}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:scale-105"
                style={{ backgroundColor: brandColor }}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with Vendor</span>
              </Link>

              <button
                type="button"
                onClick={handleShare}
                className="relative p-2.5 sm:p-3 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 shadow-xs transition-colors cursor-pointer shrink-0"
                title={copied ? "Store link copied!" : "Share store link"}
                aria-label="Share store link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in-75" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                {copied && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-neutral-900 text-white text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none animate-in fade-in slide-in-from-top-1 z-20">
                    Link copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Store Details Section: Cleanly rendered on the page below the banner */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight transition-colors"
                style={{ color: brandColor }}
              >
                {vendor.storeName}
              </h1>
              {vendor.sellerType === "guest" ? (
                <Badge className="bg-neutral-100 text-neutral-800 border-neutral-200/80 text-xs font-semibold gap-1.5 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-purple-700" />Non-Student Vendor</Badge>
              ) : (
                <Badge className="bg-neutral-100 text-neutral-800 border-neutral-200/80 text-xs font-semibold gap-1.5 shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  Student Vendor
                </Badge>
              )}
              {vendor.isRegisteredBusiness && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-bold gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Registered Business
                </Badge>
              )}
              {vendor.isTrustedSeller && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-bold gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                  Trusted Seller
                </Badge>
              )}
            </div>

            {vendor.campus && (
              <p className="text-xs sm:text-sm flex flex-wrap items-center gap-1 font-semibold transition-colors">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: brandColor }} />
                <span style={{ color: brandColor }}>{vendor.campus.name}</span>
                {(vendor.faculty || vendor.department) && (
                  <span style={{ color: brandColor }} className="opacity-80">
                    • {vendor.department || vendor.faculty}
                  </span>
                )}
                {vendor.businessAddress && (
                  <span className="text-neutral-500 font-normal">
                    • {vendor.businessAddress}
                  </span>
                )}
              </p>
            )}

            {/* Trust & Orders Badge Strip */}
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs">
              {vendor.sellerAvgRating && vendor.sellerAvgRating > 0 ? (
                <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{vendor.sellerAvgRating.toFixed(1)}</span>
                  <span className="text-neutral-500 font-normal">
                    ({vendor.sellerReviewCount || 0} reviews)
                  </span>
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[11px]">
                  ★ 5.0 New Seller
                </span>
              )}

              <span className="text-neutral-500 font-medium bg-neutral-100 px-2.5 py-0.5 rounded-lg">
                {vendor.completedOrdersCount || 0} completed campus orders
              </span>
            </div>

            {vendor.storeDescription && (
              <p className="text-xs sm:text-sm text-neutral-600 max-w-3xl leading-relaxed pt-1">
                {vendor.storeDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC TEMPLATE RENDERER */}
      <div className="container mx-auto px-4 py-8">
        {layout === "grid" && <GridLayout vendor={vendor} products={products} />}
        {layout === "list" && <ListLayout vendor={vendor} products={products} />}
        {layout === "showcase" && <ShowcaseLayout vendor={vendor} products={products} />}
        {layout === "lookbook" && <LookbookLayout vendor={vendor} products={products} />}
      </div>

      {/* 4. RECENT CUSTOMER REVIEWS ACROSS SELLER'S PRODUCTS */}
      {recentReviews.length > 0 && (
        <section className="bg-neutral-50/70 border-t border-neutral-200/80 py-12 mt-12">
          <div className="container mx-auto px-4 max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-neutral-950">
                  Recent Verified Reviews for {vendor.storeName}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verified campus student feedback from completed product orders.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {recentReviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-neutral-200/80 p-4 space-y-2.5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-900">{r.displayName}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= r.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <Link
                      href={`/product/${r.productSlug}`}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline line-clamp-1 block"
                    >
                      {r.productTitle}
                    </Link>

                    {r.comment && (
                      <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-neutral-400 block pt-1 border-t border-neutral-100">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
