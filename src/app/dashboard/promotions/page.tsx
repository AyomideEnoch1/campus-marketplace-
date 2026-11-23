import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculatePromoPrice,
  getPromoLiveStatus,
  syncPromotionsLifecycle,
} from "@/lib/promotions";
import { VendorPromotionsTable } from "./VendorPromotionsTable";

export const dynamic = "force-dynamic";

export default async function VendorPromotionsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in?callbackUrl=/dashboard/promotions");
  }

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
  });

  if (!vendor) {
    redirect("/onboarding/vendor");
  }

  // Sync scheduled and expired promotions in database
  await syncPromotionsLifecycle(vendor.id);

  const now = new Date();

  // Fetch all vendor promotions
  const promotionsRaw = await prisma.promotion.findMany({
    where: { vendorId: vendor.id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          comparePrice: true,
          stock: true,
          status: true,
          images: { take: 1, orderBy: { position: "asc" } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { endAt: "desc" }],
  });

  // Fetch vendor's published/draft products to populate product picker
  const vendorProductsRaw = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    select: {
      id: true,
      title: true,
      price: true,
      stock: true,
      images: { take: 1, orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedPromotions = promotionsRaw.map((p) => {
    const liveStatus = getPromoLiveStatus(p, now);
    const calc = calculatePromoPrice(
      p.product.price,
      p.discountType as any,
      p.discountValue
    );

    return {
      id: p.id,
      vendorId: p.vendorId,
      productId: p.productId,
      discountType: p.discountType as "PERCENTAGE" | "FIXED",
      discountValue: p.discountValue,
      promoPrice: p.promoPrice,
      startAt: p.startAt.toISOString(),
      endAt: p.endAt.toISOString(),
      label: p.label,
      status: p.status as any,
      liveStatus,
      effectivePromoPrice: calc.promoPrice,
      discountPercent: calc.discountPercent,
      savingsAmount: calc.savingsAmount,
      serverNow: now.toISOString(),
      product: {
        ...p.product,
        images: p.product.images.map((img) => ({ url: img.url })),
      },
    };
  });

  const formattedProducts = vendorProductsRaw.map((prod) => ({
    id: prod.id,
    title: prod.title,
    price: prod.price,
    stock: prod.stock,
    images: prod.images.map((img) => ({ url: img.url })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
            Timed Promotions & Flash Sales
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Run limited-time discounts, Black Friday deals, and live countdown timers on your listings
          </p>
        </div>
      </div>

      <VendorPromotionsTable
        initialPromotions={formattedPromotions}
        vendorProducts={formattedProducts}
      />
    </div>
  );
}
