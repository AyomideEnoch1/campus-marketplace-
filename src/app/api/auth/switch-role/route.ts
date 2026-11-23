import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE, verifyToken, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const switchRoleSchema = z.object({
  targetRole: z.enum(["BUYER", "VENDOR"]),
});

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No active session found" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired session" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = switchRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid target role. Expected 'BUYER' or 'VENDOR'." },
        { status: 400 }
      );
    }

    const { targetRole } = parsed.data;

    // Fetch user with vendor profile to verify permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        vendorProfile: {
          select: {
            id: true,
            status: true,
            storeName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If switching to VENDOR, ensure user has an established vendor profile
    if (targetRole === "VENDOR") {
      const hasVendorProfile = Boolean(user.vendorProfile || user.role === "VENDOR");
      if (!hasVendorProfile) {
        return NextResponse.json(
          {
            success: true,
            needsOnboarding: true,
            redirectUrl: "/auth/register?role=vendor",
            message: "Redirecting to vendor onboarding...",
          },
          { status: 200 }
        );
      }
    }

    // Generate updated JWT payload with new activeRole
    const newToken = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      activeRole: targetRole,
    });

    // Write updated session cookie
    cookieStore.set(AUTH_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    const redirectUrl = targetRole === "VENDOR" ? "/dashboard" : "/shop";

    return NextResponse.json({
      success: true,
      activeRole: targetRole,
      redirectUrl,
      message: `Switched to ${targetRole === "VENDOR" ? "Seller Mode" : "Buyer Mode"} successfully`,
    });
  } catch (error: any) {
    console.error("POST /api/auth/switch-role error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to switch account mode" },
      { status: 500 }
    );
  }
}
