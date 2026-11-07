import * as React from "react";
import Link from "next/link";
import { ProductCard } from "@/components/marketplace/ProductCard";

interface LayoutProps {
  vendor: any;
  products: any[];
}

export function GridLayout({ vendor, products }: LayoutProps) {
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
          All Products ({products.length})
        </h3>
        <span className="text-xs text-neutral-500">Classic Grid View</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={{ ...product, vendor }} />
        ))}
      </div>
    </div>
  );
}
