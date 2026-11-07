"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  MapPin,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils";

export function SavedItemsClient() {
  const { savedItems, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const [addedId, setAddedId] = React.useState<string | null>(null);

  const handleMoveToBag = (item: any) => {
    addItem({
      id: item.id,
      title: item.title,
      slug: item.slug,
      price: item.price,
      image: item.image,
      quantity: 1,
      condition: item.condition || "Good Condition",
      vendor: {
        id: item.id, // fallback
        storeName: item.vendorName || "Campus Vendor",
        slug: item.slug,
      },
    });

    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  if (savedItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-neutral-50/50">
        <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-neutral-900">
              Your Saved Items List is Empty
            </h2>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Save textbooks, dorm tech, and fashion drops by tapping the heart icon while browsing.
            </p>
          </div>
          <Link href="/shop" className="block pt-2">
            <Button
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2"
            >
              <span>Explore Campus Drops</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200/80 py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                Saved Items ({savedItems.length})
              </h1>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Items you&apos;ve bookmarked across all campus vendor storefronts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearWishlist}
              className="text-xs font-semibold text-neutral-400 hover:text-rose-600 transition-colors"
            >
              Clear all
            </button>
            <Link href="/cart">
              <Button
                variant="outline"
                className="text-xs font-bold rounded-xl gap-2 border-neutral-300"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Go to Order Bag</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Saved Items */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Image */}
                <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
                  <Link href={`/product/${item.slug}`}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-rose-500 hover:bg-rose-50 flex items-center justify-center shadow-xs transition-colors"
                    title="Remove from saved"
                  >
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 gap-2">
                    <span className="font-semibold text-emerald-700 truncate min-w-0">
                      {item.categoryName || "Campus Drop"}
                    </span>
                    {item.vendorCampus && (
                      <span className="flex items-center gap-1 shrink-0 truncate max-w-[120px]">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.vendorCampus.split(" ")[0]}</span>
                      </span>
                    )}
                  </div>

                  <Link href={`/product/${item.slug}`}>
                    <h3 className="text-sm font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-neutral-950">
                      {formatNGN(item.price)}
                    </span>
                    {item.comparePrice && item.comparePrice > item.price && (
                      <span className="text-xs text-neutral-400 line-through">
                        {formatNGN(item.comparePrice)}
                      </span>
                    )}
                  </div>

                  {item.vendorName && (
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Sold by: <span className="text-neutral-800">{item.vendorName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="p-4 pt-0">
                <Button
                  onClick={() => handleMoveToBag(item)}
                  className={`w-full text-xs font-bold rounded-xl gap-2 transition-all ${
                    addedId === item.id
                      ? "bg-emerald-700 text-white"
                      : "bg-neutral-950 hover:bg-neutral-800 text-white"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {addedId === item.id ? "Added to Bag! ✓" : "Add to Order Bag"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
