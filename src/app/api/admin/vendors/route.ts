export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

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
