import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getUserCampus, setUserCampus } from "@/lib/user-campus";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100).optional(),
  phone: z.string().trim().optional().nullable(),
  campusId: z.string().trim().optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      vendorProfile: {
        select: {
          id: true,
          storeName: true,
          slug: true,
          status: true,
          campus: {
            select: {
              id: true,
              name: true,
              city: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          orders: true,
          favorites: true,
          productReviews: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const campus = await getUserCampus(session.id);

  return NextResponse.json({
    user: {
      ...user,
      campus,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (parsed.data.fullName !== undefined) {
      updateData.fullName = parsed.data.fullName;
    }
    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone || null;
    }

    let updatedUser = null;
    if (Object.keys(updateData).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: session.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          avatarUrl: true,
          updatedAt: true,
        },
      });
    } else {
      updatedUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          avatarUrl: true,
          updatedAt: true,
        },
      });
    }

    let updatedCampus = null;
    if (parsed.data.campusId) {
      updatedCampus = await setUserCampus(session.id, parsed.data.campusId);
    } else {
      updatedCampus = await getUserCampus(session.id);
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        campus: updatedCampus,
      },
    });
  } catch (error: any) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
