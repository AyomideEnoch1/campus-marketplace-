export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { propagateVoucherStrike } from "@/lib/vouches";
import { sendVendorStatusEmail } from "@/lib/email";
import { releaseCouponSlot } from "@/lib/coupons";

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
    if (action === "APPROVE" || status === "APPROVED") {
      dataToUpdate.status = "APPROVED";
      dataToUpdate.rejectionReason = null;
      dataToUpdate.verificationTier = 2;
      dataToUpdate.approvedAt = new Date();
    } else if (action === "REJECT" || status === "REJECTED") {
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

    // Edge case / Requirement: If admin rejects vendor, release their coupon slot immediately
    if (dataToUpdate.status === "REJECTED") {
      await releaseCouponSlot(params.id, "ADMIN_REJECTED");
      dataToUpdate.accessState = "RELEASED";
    }

    const updated = await prisma.vendorProfile.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        user: true,
        campus: true,
      },
    });

    // Gate 5: When approving a vendor, automatically activate their drafted products
    // ONLY IF both gates pass: access is active AND admin has approved.
    if (updated.status === "APPROVED") {
      const hasActiveAccess =
        updated.accessState === "ACTIVE_PAID" || updated.accessState === "ACTIVE_COUPON";

      if (hasActiveAccess) {
        await prisma.product.updateMany({
          where: { vendorId: params.id, status: "DRAFT" },
          data: { status: "PUBLISHED" },
        });
      }
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

    // Send email notification to vendor asynchronously
    if (updated.user?.email && (status || action)) {
      sendVendorStatusEmail(updated.user.email, {
        storeName: updated.storeName,
        applicantName: updated.user.fullName || updated.storeName,
        status: (action === "REQUEST_INFO" ? "INFO_REQUESTED" : updated.status) as any,
        rejectionReason,
        tier: updated.verificationTier || 1,
      }).catch((e) => console.error("Vendor status email error:", e));
    }

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update vendor" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
