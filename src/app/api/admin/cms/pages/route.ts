export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { title: "asc" },
    });
    return NextResponse.json(pages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { title, slug, content, isPublished, metaTitle, metaDescription } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Title, slug, and content are required" },
        { status: 400 }
      );
    }

    const created = await prisma.page.create({
      data: {
        title,
        slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
        content,
        isPublished: isPublished ?? true,
        metaTitle,
        metaDescription,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "PAGE_CREATED",
        entityType: "Page",
        entityId: created.id,
        metadataJson: JSON.stringify({ title: created.title, slug: created.slug }),
      },
    });

    return NextResponse.json({ success: true, page: created });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create page" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
