import Link from "next/link";
import { ArrowLeft, AlertTriangle, Lock, Clock } from "lucide-react";
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

      {vendor && vendor.status !== "APPROVED" ? (
        <div className="p-8 rounded-3xl bg-amber-50/60 border border-amber-200/90 text-center max-w-2xl mx-auto space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mx-auto">
            {vendor.status === "PENDING" ? (
              <Clock className="w-7 h-7" />
            ) : vendor.status === "REJECTED" ? (
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            ) : (
              <Lock className="w-7 h-7 text-neutral-600" />
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-neutral-950">
              {vendor.status === "PENDING"
                ? "Account Awaiting Admin Approval"
                : vendor.status === "REJECTED"
                ? "Vendor Application Rejected"
                : "Vendor Account Suspended"}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
              {vendor.status === "PENDING"
                ? "Your vendor registration and credentials are currently being reviewed by campus administrators. Product uploading is disabled until your account has been approved."
                : vendor.status === "REJECTED"
                ? `Your vendor application was rejected${vendor.rejectionReason ? `: "${vendor.rejectionReason}"` : ""}. Please contact campus administrators to update your verification documents.`
                : "Your vendor account is suspended. Product uploading is disabled."}
            </p>
          </div>

          {vendor.status === "PENDING" && (
            <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200/80 text-left max-w-md mx-auto space-y-1 text-xs">
              <p className="font-semibold text-neutral-800">Store: {vendor.storeName}</p>
              <p className="text-neutral-500">Status: <span className="font-bold text-amber-700 uppercase">Under Review</span></p>
              <p className="text-neutral-500">Once an administrator approves your profile, you will immediately be able to list items.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/dashboard/products">
              <Button size="sm" variant="outline" className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-semibold text-xs">
                Return to Products Inventory
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      ) : isCapReached ? (
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
