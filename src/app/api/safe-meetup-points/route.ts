import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const campusId = searchParams.get("campusId");

    let targetCampusId = campusId;
    let vendorData: any = null;

    if (vendorId) {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          sellerType: true,
          verificationTier: true,
          isTrustedSeller: true,
          isRegisteredBusiness: true,
          storeName: true,
          campusId: true,
          campus: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      });

      if (vendor) {
        vendorData = vendor;
        targetCampusId = vendor.campusId;
      }
    }

    const meetupPoints = targetCampusId
      ? await prisma.safeMeetupPoint.findMany({
          where: { campusId: targetCampusId, active: true },
          orderBy: { name: "asc" },
        })
      : [];

    return NextResponse.json({
      vendor: vendorData,
      meetupPoints,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch safe meetup points" },
      { status: 500 }
    );
  }
}
