export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const reviews = await prisma.productReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        tags: true,
        status: true,
        helpfulCount: true,
        createdAt: true,
        product: { select: { id: true, title: true, slug: true } },
        buyer: { select: { fullName: true, email: true } },
        seller: { select: { storeName: true } },
        reports: {
          select: {
            id: true,
            reason: true,
            details: true,
            status: true,
            createdAt: true,
            reporter: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Forbidden" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
