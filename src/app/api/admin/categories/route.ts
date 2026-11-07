import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { name, slug, description, icon, parentId, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const created = await prisma.category.create({
      data: {
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
        description,
        icon: icon || "tag",
        parentId: parentId || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "CATEGORY_CREATED",
        entityType: "Category",
        entityId: created.id,
        metadataJson: JSON.stringify({ name: created.name, slug: created.slug }),
      },
    });

    return NextResponse.json({ success: true, category: created });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
