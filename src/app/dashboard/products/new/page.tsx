import Link from "next/link";
import { ArrowLeft, AlertTriangle, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeVendorEntitlements } from "@/lib/vendor-entitlements";
import { ProductForm } from "@/components/vendor/ProductForm";
import { Button } from "@/components/ui/button";

export default async function NewProductPage() {
  const session = await getSession();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const vendor = session
    ? await prisma.vendorProfile.findUnique({
        where: { userId: session.id },
        include: { _count: { select: { products: true } } },
      })
    : null;

  const entitlements = vendor ? computeVendorEntitlements(vendor) : null;
  const isCapReached = Boolean(
    entitlements && vendor && vendor._count.products >= entitlements.maxListings
  );

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
            {entitlements ? ` (${vendor?._count.products || 0} / ${entitlements.maxListings} slots used)` : ""}
          </p>
        </div>
      </div>

      {entitlements && !entitlements.hasAccess && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-950">Store Access Inactive</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Products saved while access is inactive will remain drafts and cannot be published to the live shop until access is activated.
              </p>
            </div>
          </div>
          <Link href="/dashboard/activate">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
              Activate Access
            </Button>
          </Link>
        </div>
      )}

      {isCapReached ? (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-950">Product Listing Slot Limit Reached</h3>
          <p className="text-xs text-rose-800 max-w-md mx-auto">
            You have reached the maximum allowed {entitlements?.maxListings} product listings for your current plan. Please manage or remove existing products to list new items.
          </p>
          <Link href="/dashboard/products">
            <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100">
              Return to Products Inventory
            </Button>
          </Link>
        </div>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
