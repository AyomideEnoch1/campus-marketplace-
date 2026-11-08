export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["BUYER", "VENDOR"]).default("BUYER"),
  // Vendor specific fields if registering as vendor
  storeName: z.string().optional(),
  campusId: z.string().optional(),
  whatsapp: z.string().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
  storeDescription: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid registration data" },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      password,
      phone,
      role,
      storeName,
      campusId,
      whatsapp,
      faculty,
      department,
      storeDescription,
    } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // If registering as vendor, check if vendor approval is required
    let vendorStatus = "PENDING";
    const approvalSetting = await prisma.siteSetting.findUnique({
      where: { key: "vendor_approval_required" },
    });
    if (approvalSetting && approvalSetting.value === "false") {
      vendorStatus = "APPROVED";
    }

    // Create user and vendor profile if applicable in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email: normalizedEmail,
          passwordHash,
          phone: phone || whatsapp || null,
          role: role,
        },
      });

      if (role === "VENDOR") {
        if (!storeName || !campusId || !whatsapp) {
          throw new Error("Store name, campus, and WhatsApp number are required for vendors");
        }

        const baseSlug = slugify(storeName);
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await tx.vendorProfile.findUnique({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        await tx.vendorProfile.create({
          data: {
            userId: user.id,
            storeName,
            slug: uniqueSlug,
            campusId,
            whatsapp,
            faculty: faculty || null,
            department: department || null,
            storeDescription: storeDescription || null,
            status: vendorStatus as any,
          },
        });
      }

      return user;
    });

    const token = signToken({
      userId: newUser.id,
      role: newUser.role,
      email: newUser.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      redirectTo:
        newUser.role === "VENDOR"
          ? "/dashboard"
          : "/shop",
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete registration" },
      { status: 500 }
    );
  }
}
