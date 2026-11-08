import { prisma } from "@/lib/prisma";
import { VendorRegisterClient } from "./VendorRegisterClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vendor Onboarding | Student & Guest Vendor Registration | CampusTrade",
  description: "Register as a student or guest vendor on CampusTrade Nigeria. Tiered identity verification and safe campus escrow sales.",
};

export default async function VendorRegisterPage() {
  const campuses = await prisma.campus.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      settings: true,
      safeMeetupPoints: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      _count: {
        select: {
          vendors: {
            where: {
              sellerType: "guest",
              status: "APPROVED",
            },
          },
        },
      },
    },
  });

  const sanitizedCampuses = campuses.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    city: c.city,
    settings: c.settings
      ? {
          guestVendorsEnabled: c.settings.guestVendorsEnabled,
          guestVendorCap: c.settings.guestVendorCap,
        }
      : null,
    safeMeetupPoints: c.safeMeetupPoints,
    _count: {
      vendors: c._count.vendors,
    },
  }));

  return <VendorRegisterClient campuses={sanitizedCampuses} />;
}
