import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { title, slug, content, isPublished, metaTitle, metaDescription } = body;

    const updated = await prisma.page.update({
      where: { id: params.id },
      data: {
        ...(title ? { title } : {}),
        ...(slug ? { slug: slug.toLowerCase().trim().replace(/\s+/g, "-") } : {}),
        ...(content ? { content } : {}),
        ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
        ...(metaTitle !== undefined ? { metaTitle } : {}),
        ...(metaDescription !== undefined ? { metaDescription } : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "PAGE_UPDATED",
        entityType: "Page",
        entityId: updated.id,
        metadataJson: JSON.stringify({ title: updated.title, slug: updated.slug }),
      },
    });

    return NextResponse.json({ success: true, page: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update page" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    const deleted = await prisma.page.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "PAGE_DELETED",
        entityType: "Page",
        entityId: params.id,
        metadataJson: JSON.stringify({ title: deleted.title }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete page" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
