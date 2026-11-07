import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductInteractiveView } from "@/components/marketplace/ProductInteractiveView";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { TrustBar } from "@/components/marketplace/TrustBar";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      vendor: { include: { campus: true } },
    },
  });

  if (!product) {
    return { title: "Product Not Found | CampusTrade" };
  }

  return {
    title: `${product.title} - ₦${product.price.toLocaleString()} | CampusTrade`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      variants: true,
      vendor: {
        include: {
          campus: true,
        },
      },
    },
  });

  if (!product || product.status !== "PUBLISHED") {
    notFound();
  }

  // Increment views count asynchronously
  try {
    await prisma.product.update({
      where: { id: product.id },
      data: { viewsCount: { increment: 1 } },
    });
  } catch (err) {
    // Non-blocking
  }

  // Fetch related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: "PUBLISHED",
    },
    take: 4,
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      vendor: {
        select: {
          storeName: true,
          slug: true,
          whatsapp: true,
          campus: { select: { name: true, slug: true } },
        },
      },
    },
  });

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 py-3 text-xs text-neutral-500">
        <div className="container mx-auto px-4 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <Link href="/shop" className="hover:text-neutral-900 transition-colors">
            Marketplace
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <Link
            href={`/shop?category=${product.category.slug}`}
            className="hover:text-neutral-900 transition-colors"
          >
            {product.category.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-800 truncate max-w-[200px]">
            {product.title}
          </span>
        </div>
      </div>

      {/* Main Interactive Product View */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <ProductInteractiveView product={product as any} />
      </div>

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <section className="py-14 bg-neutral-50/60 border-t border-neutral-100 mt-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950">
                  Related Campus Listings
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Similar items available in {product.category.name}
                </p>
              </div>
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                View all in category &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Guarantees */}
      <TrustBar />
    </div>
  );
}
