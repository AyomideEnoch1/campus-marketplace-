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
