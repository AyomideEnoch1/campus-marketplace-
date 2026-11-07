import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ShoppingBag, MapPin, CheckCircle } from "lucide-react";
import { formatNGN } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  vendor: any;
  products: any[];
}

export function ListLayout({ vendor, products }: LayoutProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-500">
        <p className="text-sm font-semibold">No products listed in this store yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
        <h3 className="font-extrabold text-lg text-neutral-900">
          Catalog ({products.length} Items)
        </h3>
        <span className="text-xs text-neutral-500">Detailed List View</span>
      </div>

      <div className="space-y-4">
        {products.map((p) => {
          const imgUrl =
            p.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";

          return (
            <div
              key={p.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-100 hover:border-neutral-300 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
                  <Image
                    src={imgUrl}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Badge variant="secondary" className="text-[10px] font-bold shrink-0 max-w-[130px] sm:max-w-none truncate">
                      {p.category?.name || "General"}
                    </Badge>
                    <span className="text-[10px] sm:text-[11px] text-neutral-500 shrink-0 whitespace-nowrap">
                      Condition: <strong className="text-neutral-700">{p.condition}</strong>
                    </span>
                  </div>

                  <Link href={`/product/${p.slug}`}>
                    <h4 className="font-bold text-sm sm:text-base text-neutral-950 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {p.title}
                    </h4>
                  </Link>

                  <p className="text-xs text-neutral-500 line-clamp-1 max-w-xl">
                    {p.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-neutral-400">Stock: {p.stock}</span>
                    {p.tags && (
                      <span className="text-neutral-400">&bull; Tags: {p.tags}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Direct Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                <div className="text-left sm:text-right">
                  <span className="font-extrabold text-base sm:text-xl text-neutral-900 block">
                    {formatNGN(p.price)}
                  </span>
                  {p.comparePrice && (
                    <span className="text-xs text-neutral-400 line-through">
                      {formatNGN(p.comparePrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/product/${p.slug}`}>
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                      Details
                    </Button>
                  </Link>

                  {vendor.whatsapp && (
                    <a
                      href={`https://wa.me/${vendor.whatsapp.replace(/[^0-9]/g, "")}?text=Hi,%20I%20am%20interested%20in%20"${encodeURIComponent(
                        p.title
                      )}"%20for%20${formatNGN(p.price)}%20from%20your%20CampusTrade%20store`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat Order
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
