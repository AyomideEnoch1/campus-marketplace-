import { prisma } from "@/lib/prisma";
import { AdminProductTable } from "./AdminProductTable";
import { Package, ShieldAlert, CheckCircle, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, totalCount, publishedCount, hiddenCount, flaggedCount] =
    await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true } },
          vendor: {
            select: {
              storeName: true,
              campus: { select: { name: true } },
            },
          },
          images: {
            orderBy: { position: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.product.count({ where: { status: "HIDDEN" } }),
      prisma.product.count({ where: { status: "FLAGGED" } }),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Product Moderation
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Review, feature, flag, or hide student vendor listings across all campuses.
        </p>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Total Listings
            </p>
            <p className="text-xl font-black text-white mt-0.5">{totalCount}</p>
          </div>
          <Package className="w-5 h-5 text-blue-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Published Live
            </p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {publishedCount}
            </p>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Hidden
            </p>
            <p className="text-xl font-black text-neutral-300 mt-0.5">
              {hiddenCount}
            </p>
          </div>
          <EyeOff className="w-5 h-5 text-neutral-400" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              Flagged Items
            </p>
            <p className="text-xl font-black text-red-400 mt-0.5">
              {flaggedCount}
            </p>
          </div>
          <ShieldAlert className="w-5 h-5 text-red-400" />
        </div>
      </div>

      {/* Interactive Table Component */}
      <AdminProductTable initialProducts={products as any} />
    </div>
  );
}
