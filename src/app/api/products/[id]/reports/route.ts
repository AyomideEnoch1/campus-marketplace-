export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { reason, details } = body;

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        productId: params.id,
        reportedByUserId: session ? session.userId : null,
        reason,
        details: details || null,
        status: "PENDING",
      },
    });

    // Automatically mark product as FLAGGED if it gets reported
    await prisma.product.update({
      where: { id: params.id },
      data: { status: "FLAGGED" },
    });

    return NextResponse.json({
      success: true,
      message: "Report submitted. The listing has been flagged for admin moderation.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
