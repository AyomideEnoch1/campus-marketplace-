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
    const { name, slug, description, icon, sortOrder, isActive } = body;

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(name ? { name } : {}),
        ...(slug ? { slug: slug.toLowerCase().trim().replace(/\s+/g, "-") } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "CATEGORY_UPDATED",
        entityType: "Category",
        entityId: updated.id,
        metadataJson: JSON.stringify({ name: updated.name, isActive: updated.isActive }),
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
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

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: params.id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: category has ${productCount} active products. Reassign them first.` },
        { status: 400 }
      );
    }

    const deleted = await prisma.category.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "CATEGORY_DELETED",
        entityType: "Category",
        entityId: params.id,
        metadataJson: JSON.stringify({ name: deleted.name }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
