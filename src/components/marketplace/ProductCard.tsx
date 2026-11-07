"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, MapPin, CheckCircle2, MessageCircle, Star } from "lucide-react";
import { formatNGN } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/lib/wishlist";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    condition?: string;
    isFeatured?: boolean;
    reviewCount?: number;
    avgRating?: number;
    images: { url: string; altText?: string | null }[];
    category?: { name: string; slug: string };
    vendor?: {
      storeName: string;
      slug: string;
      whatsapp?: string;
      campus?: { name: string; slug: string };
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggleSave, isSaved } = useWishlist();
  const isFavorite = isSaved(product.id);
  const primaryImage =
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  const conditionLabels: Record<string, string> = {
    NEW: "Brand New",
    USED_LIKE_NEW: "Like New",
    USED_GOOD: "Good Condition",
    USED_FAIR: "Fair Condition",
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white border border-neutral-100 overflow-hidden shadow-xs hover:shadow-md hover:border-neutral-200 transition-all duration-300">
      {/* Product Image Box */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10 max-w-[70%]">
          {discountPercent && (
            <Badge variant="accent" className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 shadow-sm shrink-0 whitespace-nowrap">
              -{discountPercent}%
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="dark" className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 shrink-0 whitespace-nowrap">
              Hot Drop
            </Badge>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSave({
              id: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price,
              comparePrice: product.comparePrice,
              image: primaryImage,
              condition: product.condition,
              categoryName: product.category?.name,
              vendorName: product.vendor?.storeName,
              vendorCampus: product.vendor?.campus?.name,
            });
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            isFavorite
              ? "bg-rose-50 text-rose-500 shadow-md"
              : "bg-white/85 backdrop-blur-xs text-neutral-600 hover:text-rose-500 hover:bg-white shadow-xs"
          }`}
          aria-label="Add to wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isFavorite ? "fill-rose-500" : ""
            }`}
          />
        </button>

        {/* Quick Add overlay button */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex gap-1.5 z-10">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 py-2 px-3 rounded-xl bg-white/95 backdrop-blur-md text-xs font-semibold text-neutral-900 shadow-md hover:bg-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Quick View
          </Link>
          {product.vendor?.whatsapp && (
            <a
              href={`https://wa.me/${product.vendor.whatsapp.replace(/[^0-9]/g, "")}?text=Hi,%20I%20am%20interested%20in%20your%20product%20"${encodeURIComponent(
                product.title
              )}"%20on%20CampusTrade`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors shrink-0"
              title="Chat Vendor on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 flex flex-col flex-grow justify-between gap-2">
        <div>
          {/* Vendor & Campus Meta */}
          {product.vendor && (
            <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
              <Link
                href={`/store/${product.vendor.slug}`}
                className="hover:text-emerald-700 hover:underline truncate max-w-[120px] font-medium"
              >
                {product.vendor.storeName}
              </Link>
              {product.vendor.campus && (
                <span className="flex items-center gap-0.5 text-neutral-400 font-medium shrink-0">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {product.vendor.campus.name.split(" ")[0]}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-semibold text-neutral-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
              {product.title}
            </h3>
          </Link>

          {/* Rating or New Badge (Section Requirement) */}
          <div className="flex items-center gap-1.5 mt-1 text-[11px]">
            {product.reviewCount && product.reviewCount >= 3 ? (
              <>
                <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{product.avgRating ? product.avgRating.toFixed(1) : "5.0"}</span>
                </div>
                <span className="text-neutral-400">({product.reviewCount})</span>
              </>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-md">
                New
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Condition */}
        <div className="pt-1 flex items-baseline justify-between gap-1 border-t border-neutral-50">
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-sm sm:text-base text-neutral-900">
              {formatNGN(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatNGN(product.comparePrice)}
              </span>
            )}
          </div>

          {product.condition && (
            <span className="text-[9px] sm:text-[10px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap">
              {conditionLabels[product.condition] || product.condition}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
