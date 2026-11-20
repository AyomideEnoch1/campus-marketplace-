"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  MapPin,
  CheckCircle2,
  MessageCircle,
  MessageSquare,
  Star,
  Plus,
  Check,
  Eye,
} from "lucide-react";
import { formatNGN } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { ProductImageLightbox } from "./ProductImageLightbox";

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
      id?: string;
      storeName: string;
      slug: string;
      whatsapp?: string;
      sellerType?: string;
      isRegisteredBusiness?: boolean;
      isTrustedSeller?: boolean;
      campus?: { name: string; slug: string };
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggleSave, isSaved } = useWishlist();
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const addedTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) {
        clearTimeout(addedTimeoutRef.current);
      }
    };
  }, []);

  const isFavorite = isSaved(product.id);
  const primaryImage =
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100,
        )
      : null;

  const conditionLabels: Record<string, string> = {
    NEW: "Brand New",
    USED_LIKE_NEW: "Like New",
    USED_GOOD: "Good Condition",
    USED_FAIR: "Fair Condition",
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdded(true);
    const added = await addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      image: primaryImage,
      quantity: 1,
      condition: product.condition
        ? conditionLabels[product.condition] || product.condition
        : undefined,
      vendor: {
        id: product.vendor?.id || (product as any).vendorId || product.vendor?.slug || "campus-vendor",
        storeName: product.vendor?.storeName || "Campus Vendor",
        slug: product.vendor?.slug || "campus-vendor",
        whatsapp: product.vendor?.whatsapp,
        campus: product.vendor?.campus
          ? {
              name: product.vendor.campus.name,
              slug: product.vendor.campus.slug,
            }
          : undefined,
        sellerType: product.vendor?.sellerType,
        isRegisteredBusiness: product.vendor?.isRegisteredBusiness,
        isTrustedSeller: product.vendor?.isTrustedSeller,
      },
    });

    if (!added) {
      setIsAdded(false);
      return;
    }

    if (addedTimeoutRef.current) {
      clearTimeout(addedTimeoutRef.current);
    }
    addedTimeoutRef.current = setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  return (
    <>
      <div className="group relative flex flex-col rounded-2xl bg-white border border-neutral-100 overflow-hidden shadow-xs hover:shadow-md hover:border-neutral-200 transition-all duration-300">
        {/* Product Image Box */}
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          <Link
            href={`/product/${product.slug}`}
            className="block relative w-full h-full"
          >
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </Link>

          {/* Top Badges */}
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col items-start gap-1 z-10 max-w-[calc(100%-36px)] pointer-events-none">
            {product.vendor?.sellerType === "guest" ? (
              <Badge className="bg-white/95 backdrop-blur-xs text-neutral-700 border border-neutral-200/80 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 shadow-xs shrink-0 whitespace-nowrap">
                Guest Vendor
              </Badge>
            ) : (
              <Badge className="bg-white/95 backdrop-blur-xs text-neutral-800 border border-neutral-200/80 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 shadow-xs shrink-0 whitespace-nowrap">
                Student Vendor
              </Badge>
            )}
            {discountPercent && (
              <Badge className="bg-amber-300 text-amber-950 border border-amber-400/60 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 shadow-sm shrink-0 whitespace-nowrap">
                -{discountPercent}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="bg-rose-500 text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 shrink-0 whitespace-nowrap shadow-xs">
                Hot Drop
              </Badge>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <button
            type="button"
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
            className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all z-10 ${
              isFavorite
                ? "bg-rose-50 text-rose-500 shadow-md"
                : "bg-white/90 backdrop-blur-xs text-neutral-600 hover:text-rose-500 hover:bg-white shadow-xs"
            }`}
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125 ${
                isFavorite ? "fill-rose-500" : ""
              }`}
            />
          </button>

          {/* Hover Overlay: "View Item Image" Action & WhatsApp */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex gap-1.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-white/95 backdrop-blur-md text-xs font-semibold text-neutral-900 shadow-md hover:bg-emerald-700 hover:text-white flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group/btn"
              title="View item image"
            >
              <Eye className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              <span>View Item Image</span>
            </button>
            {(product.vendor?.slug || product.vendor?.id) && (
              <Link
                href={`/messages?vendor=${product.vendor.slug || product.vendor.id}&product=${product.id}`}
                className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors shrink-0"
                title="Chat with Seller"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Product Content Details */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1.5 sm:gap-2">
          <div className="space-y-1">
            {/* Vendor & Campus Meta */}
            {product.vendor && (
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 gap-1">
                <Link
                  href={`/store/${product.vendor.slug}`}
                  className="hover:text-emerald-700 hover:underline truncate flex-1 min-w-0 font-medium"
                >
                  {product.vendor.storeName}
                </Link>
                {product.vendor.campus && (
                  <span className="flex items-center gap-0.5 text-neutral-400 font-medium shrink-0 text-[9px] sm:text-[10px]">
                    <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span>{product.vendor.campus.name.split(" ")[0]}</span>
                  </span>
                )}
              </div>
            )}

            {/* Title - Consistent 2-line height prevents uneven card heights */}
            <Link href={`/product/${product.slug}`} className="block">
              <h3 className="font-bold text-neutral-900 text-xs sm:text-[13px] line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors h-8 sm:h-9">
                {product.title}
              </h3>
            </Link>

            {/* Rating & Condition Tag */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] h-4.5 overflow-hidden">
              {product.reviewCount && product.reviewCount >= 3 ? (
                <div className="flex items-center gap-0.5 text-amber-500 font-bold shrink-0">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                  <span>
                    {product.avgRating ? product.avgRating.toFixed(1) : "5.0"}
                  </span>
                  <span className="text-neutral-400 font-normal">
                    ({product.reviewCount})
                  </span>
                </div>
              ) : null}

              {product.condition && (
                <span className="inline-flex items-center text-[8.5px] sm:text-[10px] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200/60 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap leading-none truncate max-w-[100px]">
                  {conditionLabels[product.condition] || product.condition}
                </span>
              )}
            </div>
          </div>

          {/* Pricing & Add to Bag - Pinned to bottom with mt-auto */}
          <div className="pt-2 sm:pt-2.5 mt-auto flex items-center justify-between gap-1.5 border-t border-neutral-100">
            <div className="flex flex-col min-w-0 flex-1 justify-center min-h-[28px]">
              <span className="font-black text-xs sm:text-sm text-neutral-900 leading-none truncate">
                {formatNGN(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-[9px] sm:text-[10px] text-neutral-400 line-through leading-none mt-1 truncate">
                  {formatNGN(product.comparePrice)}
                </span>
              )}
            </div>

            {/* Add to Bag Button with Plus Icon */}
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${product.title} to shopping bag`}
              title={isAdded ? "Added to shopping bag!" : "Add to shopping bag"}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 shadow-xs active:scale-90 ${
                isAdded
                  ? "bg-emerald-600 text-white scale-105 shadow-emerald-200/50"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md hover:scale-105"
              }`}
            >
              {isAdded ? (
                <Check className="w-3.5 h-3.5 animate-in zoom-in-75 duration-150" />
              ) : (
                <Plus className="w-3.5 h-3.5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Viewing Product Image */}
      {isLightboxOpen && (
        <ProductImageLightbox
          images={
            product.images && product.images.length > 0
              ? product.images
              : [{ url: primaryImage }]
          }
          initialIndex={0}
          title={product.title}
          price={product.price}
          condition={
            product.condition
              ? conditionLabels[product.condition] || product.condition
              : undefined
          }
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}
