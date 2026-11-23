import Link from "next/link";
import { PlusCircle, AlertCircle, Lock, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { computeVendorEntitlements } from "@/lib/vendor-entitlements";
import { VendorProductsTable } from "./VendorProductsTable";

export default async function VendorProductsPage() {
  const session = await getSession();
  if (!session) return null;

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
  });

  if (!vendor) return null;

  const entitlements = computeVendorEntitlements(vendor);

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { position: "asc" } },
      category: true,
      _count: { select: { orderItems: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
            My Product Inventory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Create, update stock, upload photos, and manage prices in Nigerian Naira (₦)
          </p>
        </div>

        <Link href="/dashboard/products/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-md shadow-emerald-600/20">
            <PlusCircle className="w-4 h-4" /> Add New Product
          </Button>
        </Link>
      </div>

      {!entitlements.hasAccess && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-950">
                {entitlements.accessState === "EXPIRED" ? "Access Expired — Public Products Hidden" : "Store Access Inactive"}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                {entitlements.accessState === "EXPIRED"
                  ? "Your vendor access has expired. Pay now to unhide your catalog and publish new products."
                  : "Activate your store access with a Founding Coupon or payment to publish products to the live campus shop."}
              </p>
            </div>
          </div>
          <Link href="/dashboard/activate">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-sm">
              Activate / Pay <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {entitlements.hasAccess && vendor.status !== "APPROVED" && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-700">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-sm text-blue-950">Store Awaiting Admin Approval</p>
            <p className="text-xs text-blue-800 mt-0.5">
              Your store access is active ({products.length} / {entitlements.maxListings} slots used). New products will remain drafts until your credentials receive administrator approval.
            </p>
          </div>
        </div>
      )}

      <VendorProductsTable initialProducts={products as any} />
    </div>
  );
}
