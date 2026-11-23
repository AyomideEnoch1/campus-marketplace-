export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";

const createAdminSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "SUPERADMIN"]).default("ADMIN"),
  emailVerified: z.boolean().default(true),
});

/**
 * GET /api/admin/users
 * Search or filter users for role management & quick promotion
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const role = (searchParams.get("role") || "").trim().toUpperCase();
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const where: any = {};

    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    if (role && role !== "ALL") {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        vendorProfile: {
          select: {
            storeName: true,
            status: true,
            campus: { select: { name: true } },
          },
        },
        _count: {
          select: {
            orders: true,
            productReviews: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new Administrator or Super Administrator directly from the Admin Dashboard
 */
export async function POST(request: Request) {
  try {
    const callerAdmin = await requireAdmin();
    const body = await request.json();

    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { fullName, email, password, phone, role, emailVerified } = parsed.data;

    // Privilege check: Only SUPERADMIN can create another SUPERADMIN
    if (role === "SUPERADMIN" && callerAdmin.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Administrators have authority to create or assign the Super Administrator role." },
        { status: 403 }
      );
    }

    // Check if an account already exists with this email AND role
    const existingWithRole = await prisma.user.findFirst({
      where: {
        email,
        role: role as any,
      },
    });

    if (existingWithRole) {
      return NextResponse.json(
        {
          error: `An administrator account with email "${email}" and role "${role}" already exists.`,
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create the new administrator record
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        phone: phone ? phone.trim() : null,
        role: role as any,
        emailVerified: emailVerified ? new Date() : null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Record audit activity log
    await prisma.activityLog.create({
      data: {
        userId: callerAdmin.id,
        action: `ADMIN_USER_CREATED_${role}`,
        entityType: "User",
        entityId: newUser.id,
        metadataJson: JSON.stringify({
          createdUserId: newUser.id,
          createdEmail: newUser.email,
          createdFullName: newUser.fullName,
          createdRole: newUser.role,
          createdByAdminId: callerAdmin.id,
          createdByAdminEmail: callerAdmin.email,
          createdByAdminRole: callerAdmin.role,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${role === "SUPERADMIN" ? "Super Administrator" : "Administrator"} account created successfully.`,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create administrator account" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
