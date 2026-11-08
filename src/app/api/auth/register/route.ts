export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["BUYER", "VENDOR"]).default("BUYER"),
  // Vendor specific fields
  sellerType: z.enum(["student", "guest"]).default("student"),
  storeName: z.string().optional(),
  campusId: z.string().optional(),
  whatsapp: z.string().optional(),
  storeDescription: z.string().optional(),
  // Student-specific fields
  faculty: z.string().optional(),
  department: z.string().optional(),
  studentIdUrl: z.string().optional(),
  // Guest-specific fields
  businessName: z.string().optional(),
  businessCategory: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhotoPath: z.string().optional(),
  cacNumber: z.string().optional(),
  cacDocumentPath: z.string().optional(),
  governmentIdType: z.enum(["voters_card", "drivers_license", "international_passport", "school_work_id"]).optional(),
  governmentIdNumber: z.string().optional(), // Raw number will be hashed with SHA-256 and never stored in plain text
  idDocumentPath: z.string().optional(),
  selfieDocumentPath: z.string().optional(),
  vouchedBy: z.string().optional(),
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
      sellerType,
      storeName,
      campusId,
      whatsapp,
      storeDescription,
      faculty,
      department,
      studentIdUrl,
      businessName,
      businessCategory,
      businessAddress,
      businessPhotoPath,
      cacNumber,
      cacDocumentPath,
      governmentIdType,
      governmentIdNumber,
      idDocumentPath,
      selfieDocumentPath,
      vouchedBy,
    } = parsed.data;

    const contactPhone = phone?.trim() || whatsapp?.trim();

    // In Guest flow, phone is required for Tier 1 OTP/Instant flow, email is optional
    if (role === "VENDOR" && sellerType === "guest" && !contactPhone) {
      return NextResponse.json(
        { error: "Phone number is required for guest vendor registration" },
        { status: 400 }
      );
    }

    // Determine email
    let userEmail = email?.toLowerCase().trim();
    if (!userEmail) {
      if (contactPhone) {
        const cleanPhone = contactPhone.replace(/[^0-9]/g, "");
        userEmail = `${cleanPhone}@guest.campustrade.ng`;
      } else {
        return NextResponse.json(
          { error: "Email address or phone number is required" },
          { status: 400 }
        );
      }
    }

    // Duplicate Phone Check across all users & vendors
    if (contactPhone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: contactPhone },
      });
      if (existingPhone) {
        return NextResponse.json(
          { error: "This phone number is already registered to an existing account. Please sign in or use another number." },
          { status: 409 }
        );
      }
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // Duplicate Government ID check for Guest Vendors
    let governmentIdHash: string | null = null;
    if (governmentIdNumber && governmentIdNumber.trim()) {
      governmentIdHash = crypto
        .createHash("sha256")
        .update(governmentIdNumber.trim().toUpperCase())
        .digest("hex");

      const existingId = await prisma.vendorProfile.findFirst({
        where: { governmentIdHash },
      });

      if (existingId) {
        return NextResponse.json(
          { error: "This government ID has already been registered with another vendor account. Duplicate registrations are prohibited." },
          { status: 409 }
        );
      }
    }

    // Campus Guest Vendor Control Verification
    if (role === "VENDOR" && sellerType === "guest" && campusId) {
      const campusSetting = await prisma.campusSetting.findUnique({
        where: { campusId },
      });

      if (campusSetting && !campusSetting.guestVendorsEnabled) {
        return NextResponse.json(
          { error: "Guest vendor registration is currently disabled for this campus. Student vendors only." },
          { status: 403 }
        );
      }

      if (campusSetting) {
        const activeGuestCount = await prisma.vendorProfile.count({
          where: {
            campusId,
            sellerType: "guest",
            status: "APPROVED",
          },
        });

        if (activeGuestCount >= campusSetting.guestVendorCap) {
          return NextResponse.json(
            { error: "Guest vendor capacity cap reached for this campus. Please contact campus admin." },
            { status: 403 }
          );
        }
      }
    }

    const passwordHash = await hashPassword(password);

    // Initial vendor status:
    // Students with auto-approval can be approved if site setting allows,
    // but guests requiring Tier 2 document review or manual review stay PENDING
    let vendorStatus = "PENDING";
    const approvalSetting = await prisma.siteSetting.findUnique({
      where: { key: "vendor_approval_required" },
    });

    if (sellerType === "student" && approvalSetting && approvalSetting.value === "false") {
      vendorStatus = "APPROVED";
    }

    // Determine verification tier
    let verificationTier = 1;
    if (sellerType === "guest") {
      // If government ID document and selfie are provided, applicant advances to Tier 2 (under manual review)
      if (idDocumentPath && selfieDocumentPath) {
        verificationTier = 2;
      }
    } else {
      // Student vendor with student ID uploaded
      if (studentIdUrl) {
        verificationTier = 2;
      }
    }

    // Payout delay: 72 hours for guest sellers (students get 48 hours)
    const payoutDelayHours = sellerType === "guest" ? 72 : 48;

    // Create user and vendor profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email: userEmail,
          passwordHash,
          phone: contactPhone || null,
          role,
        },
      });

      if (role === "VENDOR") {
        const finalStoreName = storeName?.trim() || businessName?.trim() || `${fullName}'s Store`;
        const finalCampusId = campusId || "clunilag001";
        const finalWhatsapp = whatsapp?.trim() || contactPhone || "";

        if (!finalWhatsapp) {
          throw new Error("A WhatsApp phone number is required for vendors to coordinate customer meetups");
        }

        const baseSlug = slugify(finalStoreName);
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await tx.vendorProfile.findUnique({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        const vendorProfile = await tx.vendorProfile.create({
          data: {
            userId: user.id,
            storeName: finalStoreName,
            slug: uniqueSlug,
            campusId: finalCampusId,
            whatsapp: finalWhatsapp,
            storeDescription: storeDescription || null,
            sellerType,
            verificationTier,
            payoutDelayHours,
            // Student fields
            faculty: faculty || null,
            department: department || null,
            studentIdUrl: studentIdUrl || null,
            // Guest fields
            businessName: businessName || finalStoreName,
            businessCategory: businessCategory || null,
            businessAddress: businessAddress || null,
            businessPhotoPath: businessPhotoPath || null,
            cacNumber: cacNumber || null,
            cacDocumentPath: cacDocumentPath || null,
            isRegisteredBusiness: Boolean(cacNumber || cacDocumentPath),
            governmentIdType: governmentIdType || null,
            governmentIdHash: governmentIdHash || null,
            idDocumentPath: idDocumentPath || null,
            selfieDocumentPath: selfieDocumentPath || null,
            vouchedBy: vouchedBy || null,
            status: vendorStatus as any,
          },
        });

        // If vouched by an existing user/vendor, record vouch entry
        if (vouchedBy) {
          const voucherUser = await tx.user.findUnique({
            where: { id: vouchedBy },
          });
          if (voucherUser) {
            await tx.vouch.create({
              data: {
                voucherId: voucherUser.id,
                guestId: vendorProfile.id,
                status: "ACCEPTED",
                notes: `Vouched at registration for ${finalStoreName}`,
              },
            });
          }
        }
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
