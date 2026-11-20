import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ambassador = await prisma.ambassadorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!ambassador) {
      return NextResponse.json({ error: "Ambassador not found" }, { status: 404 });
    }

    const referrals = await prisma.referral.findMany({
      where: { ambassadorId: ambassador.id },
      orderBy: { createdAt: "desc" },
      include: {
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

    return NextResponse.json({ referrals });
  } catch (err: any) {
    console.error("GET /api/ambassador/referrals error:", err);
    return NextResponse.json({ error: err.message || "Failed to load referrals" }, { status: 500 });
  }
}
