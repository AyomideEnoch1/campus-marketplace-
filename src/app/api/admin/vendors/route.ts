export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getCachedCampuses } from "@/lib/db/queries";

export async function GET() {
  try {
    await requireAdmin();

    const [vendors, campuses] = await Promise.all([
      prisma.vendorProfile.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
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
        },
      }),
      getCachedCampuses(),
    ]);

    return NextResponse.json({
      vendors,
      campuses,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch vendors" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
