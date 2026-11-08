export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { propagateVoucherStrike } from "@/lib/vouches";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const {
      status,
      rejectionReason,
      adminNotes,
      verificationTier,
      isTrustedSeller,
      isRegisteredBusiness,
      payoutDelayHours,
      action,
    } = body;

    const dataToUpdate: any = {};

    if (status !== undefined) dataToUpdate.status = status;
    if (rejectionReason !== undefined) dataToUpdate.rejectionReason = rejectionReason;
    if (adminNotes !== undefined) dataToUpdate.adminNotes = adminNotes;
    if (verificationTier !== undefined) dataToUpdate.verificationTier = Number(verificationTier);
    if (isTrustedSeller !== undefined) dataToUpdate.isTrustedSeller = Boolean(isTrustedSeller);
    if (isRegisteredBusiness !== undefined) dataToUpdate.isRegisteredBusiness = Boolean(isRegisteredBusiness);
    if (payoutDelayHours !== undefined) dataToUpdate.payoutDelayHours = Number(payoutDelayHours);

    // Convenience action shortcuts
    if (action === "APPROVE") {
      dataToUpdate.status = "APPROVED";
      dataToUpdate.rejectionReason = null;
      dataToUpdate.verificationTier = 2;
    } else if (action === "REJECT") {
      dataToUpdate.status = "REJECTED";
      if (rejectionReason) dataToUpdate.rejectionReason = rejectionReason;
    } else if (action === "REQUEST_MORE_INFO") {
      dataToUpdate.status = "PENDING";
      dataToUpdate.adminNotes = adminNotes || "Additional identification documents required";
      dataToUpdate.rejectionReason = rejectionReason || "Additional verification information required before approval";
    } else if (action === "SUSPEND") {
      dataToUpdate.status = "SUSPENDED";
      dataToUpdate.adminNotes = adminNotes || "Account suspended by administration";
      // Propagate strike to voucher if this was a vouched guest vendor
      await propagateVoucherStrike(params.id, adminNotes || "Vendor suspended by administration");
    }

    const updated = await prisma.vendorProfile.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        user: true,
        campus: true,
      },
    });

    // When approving a vendor, automatically activate their drafted products
    if (dataToUpdate.status === "APPROVED") {
      await prisma.product.updateMany({
        where: { vendorId: params.id, status: "DRAFT" },
        data: { status: "PUBLISHED" },
      });
    }

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: `VENDOR_${action || status || "UPDATED"}`,
        entityType: "VendorProfile",
        entityId: updated.id,
        metadataJson: JSON.stringify({
          storeName: updated.storeName,
          sellerType: updated.sellerType,
          status: updated.status,
          verificationTier: updated.verificationTier,
          rejectionReason,
          action,
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
