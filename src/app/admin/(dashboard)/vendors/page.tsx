export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { getCachedCampuses } from "@/lib/db/queries";
import { AdminVendorTable } from "./AdminVendorTable";

const ADMIN_VENDOR_LIST_SELECT = {
  id: true,
  storeName: true,
  slug: true,
  status: true,
  sellerType: true,
  campusId: true,
  whatsapp: true,
  faculty: true,
  department: true,
  businessCategory: true,
  businessAddress: true,
  governmentIdType: true,
  cacNumber: true,
  idDocumentPath: true,
  selfieDocumentPath: true,
  businessPhotoPath: true,
  studentIdUrl: true,
  adminNotes: true,
  verificationTier: true,
  payoutDelayHours: true,
  isTrustedSeller: true,
  isRegisteredBusiness: true,
  rejectionReason: true,
  logo: true,
  createdAt: true,
  user: { select: { fullName: true, email: true, phone: true } },
  campus: { select: { id: true, name: true, slug: true } },
  _count: { select: { products: true, orders: true } },
} as const;

export default async function AdminVendorsPage() {
  const [vendors, campuses] = await Promise.all([
    prisma.vendorProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: ADMIN_VENDOR_LIST_SELECT,
    }),
    getCachedCampuses(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Vendor Directory & Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Review onboarding requests for student vendors and off-campus guest traders, inspect identity documents, and configure trust tiers.
          </p>
        </div>
      </div>

      <AdminVendorTable initialVendors={vendors as any} campuses={campuses} />
    </div>
  );
}
