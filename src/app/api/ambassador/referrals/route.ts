import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { clampLimit, clampPage, MAX_ADMIN_PAGE_SIZE } from "@/lib/db/selects";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = clampPage(searchParams.get("page"));
    const limit = clampLimit(searchParams.get("limit"), 24, MAX_ADMIN_PAGE_SIZE);

    const ambassador = await prisma.ambassadorProfile.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });

    if (!ambassador) {
      return NextResponse.json({ error: "Ambassador not found" }, { status: 404 });
    }

    const referrals = await prisma.referral.findMany({
      where: { ambassadorId: ambassador.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        roleAtSignup: true,
        isQualified: true,
        rewardAmount: true,
        rewardStatus: true,
        notes: true,
        createdAt: true,
        referredUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
            vendorProfile: {
              select: {
                id: true,
                storeName: true,
                status: true,
                slug: true,
                _count: {
                  select: { products: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ referrals, page, limit });
  } catch (err: any) {
    console.error("GET /api/ambassador/referrals error:", err);
    return NextResponse.json({ error: err.message || "Failed to load referrals" }, { status: 500 });
  }
}
