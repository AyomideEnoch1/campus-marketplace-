import { prisma } from "@/lib/prisma";

export interface CampusAffiliation {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string | null;
}

/**
 * Retrieve the affiliated campus for a user.
 * Checks vendor profile first, then user_campus setting in SiteSetting.
 */
export async function getUserCampus(userId: string): Promise<CampusAffiliation | null> {
  try {
    // 1. Check if user has a vendor profile with a linked campus
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
      select: {
        campus: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (vendorProfile?.campus) {
      return vendorProfile.campus;
    }

    // 2. Check SiteSetting for user_campus:{userId}
    const campusSetting = await prisma.siteSetting.findUnique({
      where: { key: `user_campus:${userId}` },
    });

    if (campusSetting?.value) {
      const campus = await prisma.campus.findUnique({
        where: { id: campusSetting.value },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
        },
      });

      if (campus) {
        return campus;
      }
    }

    // 3. Fallback: check ambassador profile
    const ambassador = await prisma.ambassadorProfile.findUnique({
      where: { userId },
      select: {
        campus: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (ambassador?.campus) {
      return ambassador.campus;
    }

    return null;
  } catch (error) {
    console.error(`[getUserCampus error for ${userId}]:`, error);
    return null;
  }
}

/**
 * Assign or update the user's university campus affiliation.
 */
export async function setUserCampus(
  userId: string,
  campusId: string
): Promise<CampusAffiliation | null> {
  const campus = await prisma.campus.findUnique({
    where: { id: campusId },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      state: true,
    },
  });

  if (!campus) {
    throw new Error("Invalid campus selected");
  }

  // Save to SiteSetting
  await prisma.siteSetting.upsert({
    where: { key: `user_campus:${userId}` },
    create: {
      key: `user_campus:${userId}`,
      value: campus.id,
    },
    update: {
      value: campus.id,
    },
  });

  // If user is also a vendor, sync their storefront campus
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (vendor) {
    await prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: { campusId: campus.id },
    });
  }

  return campus;
}
