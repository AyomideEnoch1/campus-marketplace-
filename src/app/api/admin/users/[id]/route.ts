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
    const { role } = body;

    if (!["ADMIN", "VENDOR", "BUYER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { role },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: `USER_ROLE_CHANGED_${role}`,
        entityType: "User",
        entityId: updated.id,
        metadataJson: JSON.stringify({ email: updated.email, role: updated.role }),
      },
    });

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
    const admin = await requireAdmin();
    const userId = params.id;

    // 1. Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendorProfile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Prevent admin from deleting themselves
    if (targetUser.id === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own administrator account." },
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

    // 4. Delete user (cascades to vendorProfile, reviews, favorites, cart, etc.)
    await prisma.user.delete({
      where: { id: userId },
    });

    // 5. Log deletion in activity logs
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "USER_DELETED",
        entityType: "User",
        entityId: userId,
        metadataJson: JSON.stringify({
          deletedEmail: targetUser.email,
          deletedName: targetUser.fullName,
          deletedRole: targetUser.role,
          hadVendorProfile: Boolean(targetUser.vendorProfile),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.fullName} (${targetUser.email}) has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
