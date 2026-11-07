import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";
import { formatNGN } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/marketplace/ProductCard";

interface LayoutProps {
  vendor: any;
  products: any[];
}

export function ShowcaseLayout({ vendor, products }: LayoutProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-500">
        <p className="text-sm font-semibold">No products listed in this store yet.</p>
      </div>
    );
  }

  const featured = products[0];
  const remaining = products.slice(1);
  const featuredImage =
    featured.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";

  return (
    <div className="space-y-10">
      {/* 1. Large Featured Showcase Spotlight on Top */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-neutral-900 to-neutral-800 text-white p-6 sm:p-10 shadow-xl border border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap max-w-full">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Store Featured Spotlight</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {featured.title}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3">
              {featured.description}
            </p>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {formatNGN(featured.price)}
              </span>
              {featured.comparePrice && (
                <span className="text-sm text-neutral-400 line-through">
                  {formatNGN(featured.comparePrice)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={`/product/${featured.slug}`}>
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-xs">
                  View Full Item <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>

              {vendor.whatsapp && (
                <a
                  href={`https://wa.me/${vendor.whatsapp.replace(/[^0-9]/g, "")}?text=Hi,%20I%20want%20to%20order%20the%20featured%20"${encodeURIComponent(
                    featured.title
                  )}"%20from%20your%20store`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Order on WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-800 shadow-md">
            <Image
              src={featuredImage}
              alt={featured.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* 2. Grid Below for Remaining Products */}
      {remaining.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="font-extrabold text-lg text-neutral-900">
              More From {vendor.storeName} ({remaining.length})
            </h3>
            <span className="text-xs text-neutral-500">Showcase Grid</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {remaining.map((product) => (
              <ProductCard key={product.id} product={{ ...product, vendor }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
