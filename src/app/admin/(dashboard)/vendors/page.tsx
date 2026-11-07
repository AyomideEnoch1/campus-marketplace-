import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AdminVendorTable } from "./AdminVendorTable";

export default async function AdminVendorsPage() {
  const [vendors, campuses] = await Promise.all([
    prisma.vendorProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        campus: true,
        _count: { select: { products: true, orders: true } },
      },
    }),
    prisma.campus.findMany({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Student Vendor Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Review onboarding requests, inspect student credentials, and manage seller permissions
          </p>
        </div>
      </div>

      <AdminVendorTable initialVendors={vendors as any} campuses={campuses} />
    </div>
  );
}
