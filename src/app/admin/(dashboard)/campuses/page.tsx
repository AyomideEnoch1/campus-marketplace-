import { prisma } from "@/lib/prisma";
import { AdminCampusManager } from "./AdminCampusManager";

export const dynamic = "force-dynamic";

export default async function AdminCampusesPage() {
  const campuses = await prisma.campus.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { vendors: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Campus Directory Management
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Activate and manage university branches available for student trade.
        </p>
      </div>

      <AdminCampusManager initialCampuses={campuses as any} />
    </div>
  );
}
