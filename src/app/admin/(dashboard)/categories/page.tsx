import { prisma } from "@/lib/prisma";
import { AdminCategoryManager } from "./AdminCategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Category Hierarchy & Navigation
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Organize parent categories and subcategories used for marketplace navigation and filters.
        </p>
      </div>

      <AdminCategoryManager initialCategories={categories as any} />
    </div>
  );
}
