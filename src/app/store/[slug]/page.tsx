import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
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
  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug: params.slug },
    include: {
      campus: true,
      products: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: {
          images: { orderBy: { position: "asc" } },
          category: true,
        },
      },
    },
  });

  if (!vendor) notFound();

  return (
    <div>
      <StorefrontRenderer vendor={vendor as any} products={vendor.products} />
    </div>
  );
}
