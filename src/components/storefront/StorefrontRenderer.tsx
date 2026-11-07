import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  MessageCircle,
  ShieldCheck,
  Share2,
  Sparkles,
  Star,
  CheckCircle2,
  MessageSquare,
  Clock,
  Smile,
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
  const brandColor = vendor.brandColor || "#059669";
  const layout = vendor.layout || "grid";

  return (
    <div className="min-h-screen bg-white">
      {/* 1. STORE HEADER BANNER */}
      <div className="relative w-full h-44 sm:h-64 lg:h-80 bg-neutral-900 overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-black/20" />
      </div>

      {/* 2. STORE METADATA BAR */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-14 sm:-mt-20 pb-8 border-b border-neutral-100 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          {/* Logo & Store Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white overflow-hidden shadow-xl bg-white shrink-0">
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

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                  {vendor.storeName}
                </h1>
                {vendor.status === "APPROVED" && (
                  <Badge variant="default" className="text-xs bg-emerald-100 text-emerald-800 gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Campus Seller
                  </Badge>
                )}
              </div>

              {vendor.campus && (
                <p className="text-xs sm:text-sm text-neutral-600 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {vendor.campus.name} {vendor.faculty && `&bull; ${vendor.faculty}`}
                </p>
              )}

              {/* Trust & Orders Badge Strip */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                {vendor.sellerAvgRating && vendor.sellerAvgRating > 0 ? (
                  <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{vendor.sellerAvgRating.toFixed(1)}</span>
                    <span className="text-neutral-500 font-normal">
                      ({vendor.sellerReviewCount || 0} reviews)
                    </span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px]">
                    ★ 5.0 New Seller
                  </span>
                )}

                <span className="text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded-lg">
                  {vendor.completedOrdersCount || 0} completed campus orders
                </span>
              </div>

              {vendor.storeDescription && (
                <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed pt-1">
                  {vendor.storeDescription}
                </p>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {vendor.whatsapp && (
              <a
                href={`https://wa.me/${vendor.whatsapp.replace(/[^0-9]/g, "")}?text=Hi,%20I%20am%20visiting%20your%20CampusTrade%20storefront`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-md transition-all hover:scale-105"
                style={{ backgroundColor: brandColor }}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            )}

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Store link copied to clipboard!");
                }
              }}
              className="p-2.5 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-100 shadow-xs transition-colors"
              title="Share store link"
            >
              <Share2 className="w-4 h-4" />
            </button>
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
