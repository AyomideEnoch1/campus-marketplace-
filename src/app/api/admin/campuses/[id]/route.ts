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
    const {
      name,
      slug,
      city,
      state,
      isActive,
      guestVendorsEnabled,
      guestVendorCap,
      suspendGuestVendors,
      reactivateGuestVendors,
    } = body;

    const updated = await prisma.campus.update({
      where: { id: params.id },
      data: {
        ...(name ? { name } : {}),
        ...(slug ? { slug: slug.toLowerCase().trim().replace(/\s+/g, "-") } : {}),
        ...(city ? { city } : {}),
        ...(state !== undefined ? { state } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    // Update or upsert campus guest vendor settings
    if (guestVendorsEnabled !== undefined || guestVendorCap !== undefined) {
      await prisma.campusSetting.upsert({
        where: { campusId: params.id },
        update: {
          ...(guestVendorsEnabled !== undefined
            ? { guestVendorsEnabled: Boolean(guestVendorsEnabled) }
            : {}),
          ...(guestVendorCap !== undefined ? { guestVendorCap: Number(guestVendorCap) } : {}),
        },
        create: {
          campusId: params.id,
          guestVendorsEnabled:
            guestVendorsEnabled !== undefined ? Boolean(guestVendorsEnabled) : true,
          guestVendorCap: guestVendorCap !== undefined ? Number(guestVendorCap) : 25,
        },
      });
    }

    // Suspend only guest vendors on this campus without affecting student vendors
    if (suspendGuestVendors) {
      await prisma.vendorProfile.updateMany({
        where: {
          campusId: params.id,
          sellerType: "guest",
          status: "APPROVED",
        },
        data: {
          status: "SUSPENDED",
          adminNotes: "Campus-wide guest vendor pause initiated by administration",
        },
      });
    } else if (reactivateGuestVendors) {
      await prisma.vendorProfile.updateMany({
        where: {
          campusId: params.id,
          sellerType: "guest",
          status: "SUSPENDED",
        },
        data: {
          status: "APPROVED",
          adminNotes: "Campus-wide guest vendor access restored",
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "CAMPUS_UPDATED",
        entityType: "Campus",
        entityId: updated.id,
        metadataJson: JSON.stringify({ name: updated.name, isActive: updated.isActive }),
      },
    });

    return NextResponse.json({ success: true, campus: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update campus" },
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

    const vendorCount = await prisma.vendorProfile.count({
      where: { campusId: params.id },
    });

    if (vendorCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: campus has ${vendorCount} registered vendors.` },
        { status: 400 }
      );
    }

    const deleted = await prisma.campus.delete({
      where: { id: params.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "CAMPUS_DELETED",
        entityType: "Campus",
        entityId: params.id,
        metadataJson: JSON.stringify({ name: deleted.name }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete campus" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
