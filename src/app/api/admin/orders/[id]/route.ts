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
    const { status } = body;

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        vendor: { select: { storeName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: `ADMIN_ORDER_STATUS_${status}`,
        entityType: "Order",
        entityId: updated.id,
        metadataJson: JSON.stringify({
          orderNumber: updated.orderNumber,
          status: updated.status,
          vendor: updated.vendor.storeName,
        }),
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
