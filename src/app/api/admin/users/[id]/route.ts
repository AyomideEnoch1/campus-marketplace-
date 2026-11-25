export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { notificationService } from "@/lib/email/notification-service";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { role } = body;

    const allowedRoles = ["SUPERADMIN", "ADMIN", "VENDOR", "BUYER"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role-based privilege checks:
    // Only SUPERADMIN can grant SUPERADMIN role or modify a SUPERADMIN user
    if ((role === "SUPERADMIN" || targetUser.role === "SUPERADMIN") && admin.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Administrators can assign or modify the Super Administrator role." },
        { status: 403 }
      );
    }

    // Prevent demoting the primary default super-admin
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || "admin@campustrade.ng").toLowerCase();
    if (targetUser.email.toLowerCase() === defaultAdminEmail && role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "The primary Super Administrator cannot be demoted." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { role: role as any },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: `USER_ROLE_CHANGED_${role}`,
        entityType: "User",
        entityId: updated.id,
        metadataJson: JSON.stringify({
          email: updated.email,
          previousRole: targetUser.role,
          newRole: updated.role,
          updatedBy: admin.email,
          updatedByRole: admin.role,
        }),
      },
    });

    // Alert Super Admin if an administrative role was modified
    if (role === "SUPERADMIN" || role === "ADMIN" || targetUser.role === "SUPERADMIN" || targetUser.role === "ADMIN") {
      notificationService.notifyAdminSecurityAlert({
        eventType: "ADMIN_ROLE_CHANGED",
        description: `Administrator ${admin.email} (${admin.role}) changed the role of account ${updated.email} from ${targetUser.role} to ${updated.role}.`,
        actorEmail: admin.email,
        targetEmail: updated.email,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Only Super Administrators are allowed to delete users completely
    const admin = await requireSuperAdmin();
    const userId = params.id;

    // 1. Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendorProfile: true,
        ambassadorProfile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Prevent superadmin from deleting themselves
    if (targetUser.id === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own Super Administrator account." },
        { status: 400 }
      );
    }

    // 3. Prevent deleting default super-admin
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || "admin@campustrade.ng").toLowerCase();
    if (targetUser.email.toLowerCase() === defaultAdminEmail) {
      return NextResponse.json(
        { error: "The primary Super Administrator account cannot be deleted." },
        { status: 400 }
      );
    }

    // 4. Complete cascading deletion in a safe transaction
    await prisma.$transaction(async (tx) => {
      // If user has a vendor profile, clean up all vendor-associated resources
      if (targetUser.vendorProfile) {
        const vendorId = targetUser.vendorProfile.id;

        // Find vendor products
        const products = await tx.product.findMany({
          where: { vendorId },
          select: { id: true },
        });
        const productIds = products.map((p) => p.id);

        // Find orders placed for this vendor's shop
        const vendorOrders = await tx.order.findMany({
          where: { vendorId },
          select: { id: true },
        });
        const orderIds = vendorOrders.map((o) => o.id);

        // Clean up vendor orders dependencies
        if (orderIds.length > 0) {
          await tx.deliveryCode.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.dispute.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.escrowLedger.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.refund.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.payout.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.sellerRating.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
          await tx.order.deleteMany({ where: { id: { in: orderIds } } });
        }

        // Clean up any remaining order items or reviews referencing this vendor's products
        if (productIds.length > 0) {
          await tx.orderItem.deleteMany({ where: { productId: { in: productIds } } });
          await tx.productReview.deleteMany({ where: { productId: { in: productIds } } });
          await tx.favorite.deleteMany({ where: { productId: { in: productIds } } });
          await tx.report.deleteMany({ where: { productId: { in: productIds } } });
          await tx.productVariant.deleteMany({ where: { productId: { in: productIds } } });
          await tx.productImage.deleteMany({ where: { productId: { in: productIds } } });
          await tx.product.deleteMany({ where: { id: { in: productIds } } });
        }

        // Clean up vendor profile direct relations
        await tx.sellerBankAccount.deleteMany({ where: { sellerId: vendorId } });
        await tx.vouch.deleteMany({ where: { guestId: vendorId } });
        await tx.sellerRating.deleteMany({ where: { sellerId: vendorId } });
        await tx.productReview.deleteMany({ where: { sellerId: vendorId } });
        await tx.reviewReply.deleteMany({ where: { sellerId: vendorId } });
        await tx.payout.deleteMany({ where: { sellerId: vendorId } });

        // Clean up vendor conversations
        const vendorConvs = await tx.conversation.findMany({
          where: { vendorId },
          select: { id: true },
        });
        const vendorConvIds = vendorConvs.map((c) => c.id);
        if (vendorConvIds.length > 0) {
          await tx.chatMessage.deleteMany({ where: { conversationId: { in: vendorConvIds } } });
          await tx.conversation.deleteMany({ where: { id: { in: vendorConvIds } } });
        }

        await tx.vendorProfile.delete({ where: { id: vendorId } });
      }

      // If user has an ambassador profile
      if (targetUser.ambassadorProfile) {
        const ambassadorId = targetUser.ambassadorProfile.id;
        await tx.ambassadorPayout.deleteMany({ where: { ambassadorId } });
        await tx.referral.deleteMany({ where: { ambassadorId } });
        await tx.ambassadorProfile.delete({ where: { id: ambassadorId } });
      }

      // Clean up user as buyer / participant
      await tx.referral.deleteMany({ where: { referredUserId: userId } });

      const buyerConvs = await tx.conversation.findMany({
        where: { buyerId: userId },
        select: { id: true },
      });
      const buyerConvIds = buyerConvs.map((c) => c.id);
      if (buyerConvIds.length > 0) {
        await tx.chatMessage.deleteMany({ where: { conversationId: { in: buyerConvIds } } });
        await tx.conversation.deleteMany({ where: { id: { in: buyerConvIds } } });
      }

      await tx.chatMessage.deleteMany({ where: { senderId: userId } });
      await tx.reviewReport.deleteMany({ where: { reporterId: userId } });
      await tx.reviewHelpfulVote.deleteMany({ where: { userId } });
      await tx.productReview.deleteMany({ where: { buyerId: userId } });
      await tx.sellerRating.deleteMany({ where: { buyerId: userId } });
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.report.deleteMany({ where: { reportedByUserId: userId } });
      await tx.vouch.deleteMany({ where: { voucherId: userId } });
      await tx.dispute.deleteMany({ where: { buyerId: userId } });
      await tx.notification.deleteMany({ where: { userId } });

      // Unlink buyer from placed orders so historical order totals are preserved without FK blockage
      await tx.order.updateMany({
        where: { buyerId: userId },
        data: { buyerId: null },
      });

      // Nullify user references in activity logs
      await tx.activityLog.updateMany({
        where: { userId },
        data: { userId: null },
      });

      // Finally, delete the User record completely
      await tx.user.delete({
        where: { id: userId },
      });
    }, { maxWait: 15000, timeout: 30000 });

    // 5. Log complete deletion in activity logs
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "USER_DELETED_COMPLETELY",
        entityType: "User",
        entityId: userId,
        metadataJson: JSON.stringify({
          deletedEmail: targetUser.email,
          deletedName: targetUser.fullName,
          deletedRole: targetUser.role,
          hadVendorProfile: Boolean(targetUser.vendorProfile),
          hadAmbassadorProfile: Boolean(targetUser.ambassadorProfile),
          deletedBy: admin.email,
          deletedByRole: admin.role,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.fullName} (${targetUser.email}) and all associated records have been permanently deleted.`,
    });
  } catch (error: any) {
    console.error("Failed to delete user completely:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user completely" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
