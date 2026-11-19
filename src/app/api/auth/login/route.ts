export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().min(2, "Please enter your email or phone number").optional(),
  email: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "vendor", "BUYER", "VENDOR", "ADMIN", "admin"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid credentials" },
        { status: 400 }
      );
    }

    const rawIdentifier = (parsed.data.identifier || parsed.data.email || "").trim();
    if (!rawIdentifier) {
      return NextResponse.json(
        { error: "Email address or phone number is required" },
        { status: 400 }
      );
    }

    const { password, role } = parsed.data;
    const lowerIdentifier = rawIdentifier.toLowerCase();
    const digitsOnly = rawIdentifier.replace(/[^0-9]/g, "");

    const possibleQueries: any[] = [{ email: lowerIdentifier }];

    if (digitsOnly.length >= 7) {
      possibleQueries.push({ phone: rawIdentifier });
      possibleQueries.push({ phone: `+${digitsOnly}` });
      if (digitsOnly.startsWith("234") && digitsOnly.length === 13) {
        possibleQueries.push({ phone: `0${digitsOnly.slice(3)}` });
        possibleQueries.push({ phone: `+${digitsOnly}` });
      } else if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
        possibleQueries.push({ phone: `+234${digitsOnly.slice(1)}` });
        possibleQueries.push({ phone: digitsOnly });
      } else if (digitsOnly.length === 10) {
        possibleQueries.push({ phone: `+234${digitsOnly}` });
        possibleQueries.push({ phone: `0${digitsOnly}` });
      }
      possibleQueries.push({ email: `${digitsOnly}@guest.campustrade.ng` });
    }

    // Look up the user directly by credentials without requiring pre-selected role tabs
    const user = await prisma.user.findFirst({
      where: { OR: possibleQueries },
      include: {
        vendorProfile: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    // Automatically decipher destination according to the user's account role
    const isVendor = user.role === "VENDOR" || !!user.vendorProfile;
    const isAdmin = user.role === "ADMIN";

    const defaultRedirect = isAdmin
      ? "/admin"
      : isVendor
      ? "/dashboard"
      : "/shop";

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        vendorProfile: user.vendorProfile
          ? {
              id: user.vendorProfile.id,
              storeName: user.vendorProfile.storeName,
              slug: user.vendorProfile.slug,
              status: user.vendorProfile.status,
              sellerType: user.vendorProfile.sellerType,
            }
          : null,
      },
      redirectTo: defaultRedirect,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    const errorMessage =
      error?.message?.includes("EMAXCONNSESSION") || error?.message?.includes("connection")
        ? "Database connection limit reached. Please try again in a few moments."
        : error?.message || "Something went wrong. Please try again later.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
