import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/vendor/ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
        <Link
          href="/dashboard/products"
          className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-950 tracking-tight">
            Add New Product Listing
          </h1>
          <p className="text-xs text-neutral-500">
            Publish an item to your student storefront and general campus catalog
          </p>
        </div>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
