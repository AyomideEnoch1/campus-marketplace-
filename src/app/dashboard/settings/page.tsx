import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoreCustomizerClient } from "../customize/StoreCustomizerClient";

export default async function VendorSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
    include: {
      campus: true,
      products: { take: 4, include: { images: true, category: true } },
    },
  });

  if (!vendor) redirect("/vendor/register");

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
          Store & Contact Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Manage your contact WhatsApp, store name, bio, and visual brand assets
        </p>
      </div>

      <StoreCustomizerClient initialVendor={vendor} sampleProducts={vendor.products} />
    </div>
  );
}
