export const dynamic = "force-dynamic";

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
    const { status, isFeatured } = body;

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
      },
      include: {
        vendor: { select: { storeName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: `PRODUCT_MODERATED_${status || "UPDATED"}`,
        entityType: "Product",
        entityId: updated.id,
        metadataJson: JSON.stringify({
          title: updated.title,
          vendor: updated.vendor.storeName,
          status: updated.status,
          isFeatured: updated.isFeatured,
        }),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
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

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { vendor: { select: { storeName: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "PRODUCT_DELETED",
        entityType: "Product",
        entityId: params.id,
        metadataJson: JSON.stringify({
          title: product.title,
          vendor: product.vendor.storeName,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
