export const dynamic = "force-dynamic";
export const revalidate = 0;
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StorefrontRenderer } from "@/components/storefront/StorefrontRenderer";

interface StorePageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug: params.slug },
    include: { campus: true },
  });

  if (!vendor) {
    return { title: "Store Not Found | CampusTrade" };
  }

  return {
    title: `${vendor.storeName} | ${vendor.campus?.name} Student Store`,
    description:
      vendor.storeDescription ||
      `Shop authentic products from ${vendor.storeName} on CampusTrade.`,
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const session = await getSession();

  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug: params.slug },
    include: {
      campus: true,
    },
  });

  if (!vendor) notFound();

  // If vendor is viewing their own live store, show all their active products; otherwise show PUBLISHED items
  const isOwner = session?.id === vendor.userId;
  const products = await prisma.product.findMany({
    where: {
      vendorId: vendor.id,
      ...(isOwner ? { status: { not: "HIDDEN" } } : { status: "PUBLISHED" }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
    },
  });

  if (!vendor) notFound();

  // Fetch completed orders count & recent customer reviews
  const [completedOrdersCount, recentReviews] = await Promise.all([
    prisma.order.count({
      where: {
        vendorId: vendor.id,
        status: { in: ["CONFIRMED", "DELIVERED"] },
      },
    }),
    prisma.productReview.findMany({
      where: {
        sellerId: vendor.id,
        status: "PUBLISHED",
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { title: true, slug: true } },
        buyer: { select: { fullName: true } },
      },
    }),
  ]);

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
    </div>
  );
}
