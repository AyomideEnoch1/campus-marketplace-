"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import {
  Heart,
  ShoppingBag,
  MessageCircle,
  Share2,
  ShieldCheck,
  MapPin,
  Check,
  Box,
  Truck,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { formatNGN } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";

interface ProductInteractiveViewProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    comparePrice?: number | null;
    stock: number;
    condition: string;
    status: string;
    model3dUrl?: string | null;
    videoUrl?: string | null;
    tags?: string | null;
    images: { id: string; url: string; position: number }[];
    category: { id: string; name: string; slug: string };
    vendor: {
      id: string;
      storeName: string;
      slug: string;
      brandColor?: string | null;
      whatsapp?: string | null;
      logo?: string | null;
      storeDescription?: string | null;
      campus?: { name: string; city: string; slug: string };
    };
  };
}

export function ProductInteractiveView({ product }: ProductInteractiveViewProps) {
  const { addItem } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<"photo" | "3d">("photo");
  const [quantity, setQuantity] = React.useState(1);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [addedSuccess, setAddedSuccess] = React.useState(false);

  const images = product.images.length > 0
    ? product.images.map((img) => img.url)
    : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"];

  const currentImage = images[selectedImageIndex] || images[0];

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  const conditionLabels: Record<string, string> = {
    NEW: "Brand New",
    USED_LIKE_NEW: "Used - Like New",
    USED_GOOD: "Used - Good Condition",
    USED_FAIR: "Used - Fair Condition",
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      image: currentImage,
      quantity,
      condition: conditionLabels[product.condition] || product.condition,
      vendor: {
        id: product.vendor.id,
        storeName: product.vendor.storeName,
        slug: product.vendor.slug,
        whatsapp: product.vendor.whatsapp || undefined,
        campus: product.vendor.campus || undefined,
      },
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Product link copied to clipboard!");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Optional Google Model Viewer Script for 3D glb models */}
      {product.model3dUrl && (
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"
          strategy="lazyOnload"
        />
      )}

      {/* LEFT: Image Gallery & 3D Viewer */}
      <div className="lg:col-span-7 space-y-4">
        {/* Switcher if 3D model exists */}
        {product.model3dUrl && (
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-100 w-fit text-xs font-bold">
            <button
              onClick={() => setViewMode("photo")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === "photo" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
              }`}
            >
              Photos ({images.length})
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === "3d" ? "bg-emerald-600 text-white shadow-sm" : "text-neutral-500"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              Interactive 3D View
            </button>
          </div>
        )}

        {/* Main Display Frame */}
        <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-xs">
          {viewMode === "photo" ? (
            <Image
              src={currentImage}
              alt={product.title}
              fill
              priority
              className="object-cover object-center"
            />
          ) : (
            // Google Model Viewer Web Component
            <div className="w-full h-full flex items-center justify-center bg-neutral-900">
              {/* @ts-ignore */}
              <model-viewer
                src={product.model3dUrl}
                alt={product.title}
                auto-rotate
                camera-controls
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
            {discountPercent && (
              <Badge variant="accent" className="font-extrabold text-xs px-2.5 py-1 shadow-md">
                Save {discountPercent}%
              </Badge>
            )}
            <Badge variant="dark" className="bg-black/75 backdrop-blur-md text-white text-xs">
              {conditionLabels[product.condition] || product.condition}
            </Badge>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
              isFavorite
                ? "bg-rose-50 text-rose-500 shadow-md"
                : "bg-white/90 backdrop-blur-md text-neutral-700 hover:text-rose-500 hover:bg-white shadow-xs"
            }`}
            aria-label="Save to wishlist"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-rose-500" : ""}`} />
          </button>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedImageIndex(idx);
                  setViewMode("photo");
                }}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                  selectedImageIndex === idx && viewMode === "photo"
                    ? "border-emerald-600 ring-2 ring-emerald-500/20 scale-105"
                    : "border-neutral-200 hover:border-neutral-300 opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Product Details & Purchase Actions */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {/* Category & Campus Meta */}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="text-emerald-700 font-bold hover:underline"
            >
              {product.category.name}
            </Link>
            {product.vendor.campus && (
              <span className="flex items-center gap-1 font-medium text-neutral-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {product.vendor.campus.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight leading-tight">
            {product.title}
          </h1>

          {/* Pricing & Stock Status */}
          <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-100 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-neutral-950">
                  {formatNGN(product.price)}
                </span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatNGN(product.comparePrice)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                On-campus payment & pickup &bull; Zero interstate delivery charge
              </p>
            </div>

            <div className="text-right">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3" /> In Stock ({product.stock})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Product Overview
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Tags */}
          {product.tags && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.tags.split(",").map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600"
                >
                  #{t.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="pt-2 flex items-center gap-4">
            <span className="text-xs font-bold text-neutral-700">Quantity:</span>
            <div className="flex items-center border border-neutral-200 rounded-xl bg-white shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-l-xl transition-colors font-bold text-sm"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-sm text-neutral-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-r-xl transition-colors font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons: Add to Cart & WhatsApp */}
          <div className="pt-4 space-y-3">
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 h-12 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold gap-2 text-sm shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                {addedSuccess ? "Added to Bag! ✓" : "Add to Order Bag"}
              </Button>

              <button
                type="button"
                onClick={handleShare}
                className="w-12 h-12 rounded-2xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors shadow-xs shrink-0"
                title="Share Item"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Direct WhatsApp Chat Action */}
            {product.vendor.whatsapp && (
              <a
                href={`https://wa.me/${product.vendor.whatsapp.replace(/[^0-9]/g, "")}?text=Hi,%20I%20am%20interested%20in%20"${encodeURIComponent(
                  product.title
                )}"%20listed%20for%20${formatNGN(product.price)}%20on%20CampusTrade`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-5 h-5" />
                Chat Vendor on WhatsApp &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Vendor Identity Card */}
        <div className="p-5 rounded-3xl bg-neutral-50 border border-neutral-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-xs shrink-0">
                {product.vendor.logo ? (
                  <img src={product.vendor.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                    {product.vendor.storeName[0]}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-neutral-900">
                  {product.vendor.storeName}
                </h4>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Student Vendor
                </p>
              </div>
            </div>

            <Link href={`/store/${product.vendor.slug}`}>
              <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl">
                Storefront
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3 text-emerald-600" /> Campus pickup point
            </span>
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-emerald-600" /> Inspect before payment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
