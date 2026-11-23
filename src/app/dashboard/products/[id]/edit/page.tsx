import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/vendor/ProductForm";

interface EditProductPageProps {
  params: { id: string };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
  });
  if (!vendor) redirect("/auth/register?role=vendor");

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, vendorId: vendor.id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: true,
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

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
            Edit Product: {product.title}
          </h1>
          <p className="text-xs text-neutral-500">
            Update pricing, images, stock quantity, or status
          </p>
        </div>
      </div>

      {vendor.status !== "APPROVED" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-xs sm:text-sm text-amber-950">Store Awaiting Admin Approval</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Your vendor account is currently pending administrator approval. Changes will be saved, but this product cannot be published to the public campus shop until your store is approved.
            </p>
          </div>
        </div>
      )}

      <ProductForm initialData={product} categories={categories} isEditing={true} />
    </div>
  );
}
