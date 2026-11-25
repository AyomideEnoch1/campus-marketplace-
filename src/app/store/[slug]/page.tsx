import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { StorefrontRenderer } from "@/components/storefront/StorefrontRenderer";
import { Button } from "@/components/ui/button";
import { getVendorBySlug, getStorefrontData } from "@/lib/db/queries";
import { clampPage } from "@/lib/db/selects";

export const revalidate = 60;

interface StorePageProps {
  params: { slug: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const vendor = await getVendorBySlug(params.slug);

  if (!vendor) {
    return { title: "Store Not Found | ọjà" };
  }

  return {
    title: `${vendor.storeName} | ${vendor.campus?.name} Student Store`,
    description:
      vendor.storeDescription ||
      `Shop authentic products from ${vendor.storeName} on ọjà.`,
  };
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const vendor = await getVendorBySlug(params.slug);
  if (!vendor) notFound();

  const currentPage = clampPage(searchParams?.page);
  const { products, totalPages, page, completedOrdersCount, recentReviews } =
    await getStorefrontData(vendor.id, false, currentPage);

  const formattedReviews = recentReviews.map((r) => {
    let displayName = "Student Buyer";
    if (r.buyer?.fullName) {
      const parts = r.buyer.fullName.trim().split(" ");
      displayName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    }
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      displayName,
      productTitle: r.product.title,
      productSlug: r.product.slug,
    };
  });

  return (
    <div>
      <StorefrontRenderer
        vendor={
          {
            ...vendor,
            completedOrdersCount,
          } as any
        }
        products={products}
        recentReviews={formattedReviews}
      />
      {totalPages > 1 && (
        <div className="container mx-auto px-4 pb-12 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/store/${vendor.slug}?page=${page - 1}`} prefetch={false}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
                &larr; Previous
              </Button>
            </Link>
          )}
          <span className="px-3 py-1.5 text-xs font-semibold text-neutral-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/store/${vendor.slug}?page=${page + 1}`} prefetch={false}>
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
                Next &rarr;
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
