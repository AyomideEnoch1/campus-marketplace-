import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { VendorProductsTable } from "./VendorProductsTable";

export default async function VendorProductsPage() {
  const session = await getSession();
  if (!session) return null;

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
  });

  if (!vendor) return null;

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

      <VendorProductsTable initialProducts={products as any} />
    </div>
  );
}
