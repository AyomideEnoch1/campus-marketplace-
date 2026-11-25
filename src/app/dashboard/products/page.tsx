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
    select: {
      id: true,
      status: true,
      rejectionReason: true,
      accessState: true,
      accessExpiresAt: true,
    },
  });

  if (!vendor) return null;

  const paymentRestrictionSetting = await prisma.siteSetting.findUnique({
    where: { key: "require_vendor_payment" },
  });
  const paymentRestrictionEnabled = paymentRestrictionSetting?.value !== "false";
  const entitlements = computeVendorEntitlements(vendor, { paymentRestrictionEnabled });

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      comparePrice: true,
      stock: true,
      status: true,
      viewsCount: true,
      createdAt: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      category: { select: { name: true } },
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

        {vendor.status === "APPROVED" ? (
          <Link href="/dashboard/products/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-md shadow-emerald-600/20">
              <PlusCircle className="w-4 h-4" /> Add New Product
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              disabled
              className="bg-neutral-200 text-neutral-400 cursor-not-allowed font-bold gap-2 text-xs"
              title="Administrator approval required to upload products"
            >
              <Lock className="w-4 h-4" /> Add New Product
            </Button>
            <span className="text-xs text-amber-700 font-medium hidden sm:inline">
              Approval required
            </span>
          </div>
        )}
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

      {vendor.status !== "APPROVED" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-sm text-amber-950">
              {vendor.status === "PENDING"
                ? "Store Awaiting Admin Approval"
                : vendor.status === "REJECTED"
                ? "Vendor Application Rejected"
                : "Vendor Account Suspended"}
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {vendor.status === "PENDING"
                ? "Your vendor registration is currently under review by campus administrators. Product uploading is disabled until your account is approved."
                : vendor.status === "REJECTED"
                ? `Your vendor application was rejected${vendor.rejectionReason ? `: ${vendor.rejectionReason}` : ""}. Please contact campus administrators to update your credentials.`
                : "Your vendor account is suspended. Product uploading and store operations are currently disabled."}
            </p>
          </div>
        </div>
      )}

      <VendorProductsTable initialProducts={products as any} />
    </div>
  );
}
