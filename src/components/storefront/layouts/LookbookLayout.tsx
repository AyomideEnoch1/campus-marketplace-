import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Heart, ArrowUpRight } from "lucide-react";
import { formatNGN } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  vendor: any;
  products: any[];
}

export function LookbookLayout({ vendor, products }: LayoutProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-neutral-500">
        <p className="text-sm font-semibold">No products listed in this store yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
        <div>
          <h3 className="font-extrabold text-lg text-neutral-900 tracking-tight">
            Editorial Collection
          </h3>
          <p className="text-xs text-neutral-500">Magazine & Lookbook Curation</p>
        </div>
        <span className="text-xs font-semibold text-neutral-400">
          {products.length} Curated Looks
        </span>
      </div>

      {/* Lookbook Staggered Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((p, idx) => {
          const imgUrl =
            p.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80";

          return (
            <div
              key={p.id}
              className="group relative flex flex-col rounded-3xl overflow-hidden bg-white border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-500"
            >
              {/* Massive Editorial Photo */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
                <Image
                  src={imgUrl}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Top Badge */}
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10">
                  <Badge className="bg-white/90 backdrop-blur-md text-neutral-900 font-bold text-[10px] sm:text-xs uppercase tracking-wider shrink-0 whitespace-nowrap">
                    Look #{idx + 1}
                  </Badge>
                </div>

                {/* WhatsApp button */}
                {vendor.whatsapp && (
                  <a
                    href={`https://wa.me/${vendor.whatsapp.replace(/[^0-9]/g, "")}?text=Hi,%20I%20love%20Look%20#${idx + 1}%20("${encodeURIComponent(
                      p.title
                    )}")%20from%20your%20Lookbook`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                    title="Inquire Look"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}

                {/* Editorial Caption on Photo */}
                <div className="absolute bottom-5 left-5 right-5 text-white z-10 space-y-2">
                  <Link href={`/product/${p.slug}`}>
                    <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight group-hover:underline flex items-center justify-between">
                      <span>{p.title}</span>
                      <ArrowUpRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </h4>
                  </Link>
                  <p className="text-xs text-neutral-200 line-clamp-2">
                    {p.description}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xl font-black text-emerald-400">
                      {formatNGN(p.price)}
                    </span>
                    <span className="text-xs text-neutral-300 bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                      {p.condition}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
