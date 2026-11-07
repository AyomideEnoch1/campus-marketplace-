import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoreCustomizerClient } from "./StoreCustomizerClient";

export default async function CustomizeStorePage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
    include: {
      campus: true,
      products: {
        where: { status: "PUBLISHED" },
        take: 6,
        include: {
          images: { orderBy: { position: "asc" } },
          category: true,
        },
      },
    },
  });

  if (!vendor) redirect("/vendor/register");

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
          Store Customizer & Layouts
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Select from 4 real-time storefront templates, customize brand colors, logos, and preview live
        </p>
      </div>

      <StoreCustomizerClient initialVendor={vendor} sampleProducts={vendor.products} />
    </div>
  );
}
