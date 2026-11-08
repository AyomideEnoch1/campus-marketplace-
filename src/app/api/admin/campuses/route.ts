export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const campuses = await prisma.campus.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { vendors: true } },
      },
    });
    return NextResponse.json(campuses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { name, slug, city, state } = body;

    if (!name || !slug || !city) {
      return NextResponse.json(
        { error: "Name, slug, and city are required" },
        { status: 400 }
      );
    }

    const created = await prisma.campus.create({
      data: {
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
        city,
        state: state || null,
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "CAMPUS_CREATED",
        entityType: "Campus",
        entityId: created.id,
        metadataJson: JSON.stringify({ name: created.name, slug: created.slug }),
      },
    });

    return NextResponse.json({ success: true, campus: created });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create campus" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
