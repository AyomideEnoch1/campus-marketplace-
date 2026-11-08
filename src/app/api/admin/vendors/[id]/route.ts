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
    const { status, rejectionReason, adminNotes } = body;

    const updated = await prisma.vendorProfile.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(rejectionReason !== undefined ? { rejectionReason } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
      include: {
        user: true,
      },
    });

    // When approving a vendor, automatically activate their drafted products
    if (status === "APPROVED") {
      await prisma.product.updateMany({
        where: { vendorId: params.id, status: "DRAFT" },
        data: { status: "PUBLISHED" },
      });
    }

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: `VENDOR_${status || "UPDATED"}`,
        entityType: "VendorProfile",
        entityId: updated.id,
        metadataJson: JSON.stringify({
          storeName: updated.storeName,
          status: updated.status,
          rejectionReason,
        }),
      },
    });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update vendor" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
