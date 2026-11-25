import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminUserTable } from "./AdminUserTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
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
          productReviews: true,
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
          Manage buyers, vendors, administrators, and super-administrators with role-based access control.
        </p>
      </div>

      <AdminUserTable
        initialUsers={users as any}
        currentAdminRole={session?.role}
        currentAdminId={session?.id}
      />
    </div>
  );
}
