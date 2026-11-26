import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
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

  if (!vendor) redirect("/auth/register?role=vendor");

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

      {/* Payout Bank Account Link Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-neutral-950">Payout Bank Account Details</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Set and verify the Nigerian bank account where your escrow sales payments are delivered.
            </p>
          </div>
        </div>
        <Link href="/dashboard/wallet" className="shrink-0">
          <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs">
            <span>Manage Payout Bank</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      <StoreCustomizerClient initialVendor={vendor} sampleProducts={vendor.products} />
    </div>
  );
}
