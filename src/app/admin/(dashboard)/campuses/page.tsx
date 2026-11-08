import { prisma } from "@/lib/prisma";
import { AdminCampusManager } from "./AdminCampusManager";

export const dynamic = "force-dynamic";

export default async function AdminCampusesPage() {
  const campuses = await prisma.campus.findMany({
    orderBy: { name: "asc" },
    include: {
      settings: true,
      safeMeetupPoints: {
        orderBy: { name: "asc" },
      },
      _count: { select: { vendors: true } },
    },
  });

  const guestCounts = await prisma.vendorProfile.groupBy({
    by: ["campusId", "sellerType"],
    _count: { id: true },
    where: { status: "APPROVED" },
  });

  const campusesWithCounts = campuses.map((c) => {
    const studentCount =
      guestCounts.find((g) => g.campusId === c.id && g.sellerType === "student")?._count.id || 0;
    const guestCount =
      guestCounts.find((g) => g.campusId === c.id && g.sellerType === "guest")?._count.id || 0;

    return {
      ...c,
      studentCount,
      guestCount,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Campus Directory & Guest Vendor Governance
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Activate universities, configure guest vendor registration caps, safe campus meetup zones, and manage student vs guest policies.
        </p>
      </div>

      <AdminCampusManager initialCampuses={campusesWithCounts as any} />
    </div>
  );
}
