import { prisma } from "@/lib/prisma";
import { AdminUserTable } from "./AdminUserTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendorProfile: {
        select: {
          storeName: true,
          status: true,
          campus: { select: { name: true } },
        },
      },
      _count: {
        select: {
          orders: true,
          reviews: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Users & Role Management
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Manage buyers, vendors, and super-administrators with role-based access control.
        </p>
      </div>

      <AdminUserTable initialUsers={users as any} />
    </div>
  );
}
