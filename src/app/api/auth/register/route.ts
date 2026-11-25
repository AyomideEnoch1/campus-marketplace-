export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { hashPassword, signToken, verifyToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from "@/lib/auth";
import { slugify, cleanPhoneNumber } from "@/lib/utils";
import { attributeReferral } from "@/lib/referral";
import { createAndSendVerificationEmail } from "@/lib/email-service";
import { notificationService } from "@/lib/email/notification-service";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["BUYER", "VENDOR"]).default("BUYER"),
  buyerType: z.enum(["student", "guest"]).optional(),
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
  studentIdNumber: z.string().optional(),
  studentId: z.string().optional(),
  // Guest-specific fields
  businessName: z.string().optional(),
  businessCategory: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhotoPath: z.string().optional(),
  cacNumber: z.string().optional(),
  cacDocumentPath: z.string().optional(),
  governmentIdType: z.enum(["nin", "voters_card", "drivers_license", "international_passport", "school_work_id"]).optional(),
  governmentIdNumber: z.string().optional(), // Raw number will be hashed with SHA-256 and never stored in plain text
  idDocumentPath: z.string().optional(),
  selfieDocumentPath: z.string().optional(),
  vouchedBy: z.string().optional(),
  referralCode: z.string().optional(),
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
      studentIdNumber,
      studentId,
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
      referralCode,
    } = parsed.data;

    // Clean whitespaces and standardize phone numbers for database consistency
    const cleanPhoneCandidate = phone ? cleanPhoneNumber(phone) : "";
    const cleanWhatsappCandidate = whatsapp ? cleanPhoneNumber(whatsapp) : "";
    const cleanPhone = cleanPhoneCandidate || cleanWhatsappCandidate || null;
    const cleanWhatsapp = cleanWhatsappCandidate || cleanPhone;

    // Check if user is already authenticated via session cookie (e.g. Google OAuth continuation)
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    let sessionUser: { userId: string; role: string; email: string } | null = null;
    if (sessionToken) {
      sessionUser = verifyToken(sessionToken);
    }

    if (!sessionUser && (!password || password.length < 6)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // In Student flow, mandatory student ID photo verification holding ID next to face
    if (role === "VENDOR" && sellerType === "student") {
      if (!studentIdUrl || !studentIdUrl.trim()) {
        return NextResponse.json(
          {
            error:
              "Student ID verification photo is mandatory. Please upload a clear photo of yourself holding your student ID card next to your face.",
          },
          { status: 400 }
        );
      }
    }

    // In Non-Student Vendor (guest) flow, WhatsApp phone is required, email is required
    if (role === "VENDOR" && sellerType === "guest") {
      if (!cleanPhone) {
        return NextResponse.json(
          { error: "WhatsApp number is required for Non-Student Vendor registration" },
          { status: 400 }
        );
      }
      if (!email || !email.trim()) {
        return NextResponse.json(
          { error: "Email address is required for Non-Student Vendor registration" },
          { status: 400 }
        );
      }
    }

    // Determine email
    let userEmail = email?.toLowerCase().trim();
    if (!userEmail) {
      if (cleanPhone) {
        const digitsOnly = cleanPhone.replace(/[^0-9]/g, "");
        userEmail = `${digitsOnly}@guest.campustrade.ng`;
      } else {
        return NextResponse.json(
          { error: "Email address or phone number is required" },
          { status: 400 }
        );
      }
    }

    // Duplicate Email Check scoped strictly to the selected role/account type
    let pendingUserId: string | null = null;
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: userEmail,
        role,
        ...(sessionUser ? { id: { not: sessionUser.userId } } : {}),
      },
      include: {
        vendorProfile: true,
      },
    });

    if (existingEmail) {
      if (existingEmail.emailVerified !== null) {
        return NextResponse.json(
          {
            error: `An account with this email address already exists for a ${
              role === "VENDOR" ? "Campus Vendor" : "Student Buyer"
            }. Please sign in or use another email.`,
          },
          { status: 409 }
        );
      } else {
        // Safe continuation for pending unverified registration
        pendingUserId = existingEmail.id;
      }
    }

    // Duplicate Phone Check scoped strictly to the selected role/account type
    if (cleanPhone && cleanPhone.length >= 7) {
      const digits = cleanPhone.replace(/\D/g, "");
      const altLocalPhone = digits.startsWith("234") ? `0${digits.slice(3)}` : null;

      const existingPhone = await prisma.user.findFirst({
        where: {
          role,
          OR: [
            { phone: cleanPhone },
            ...(altLocalPhone ? [{ phone: altLocalPhone }] : []),
          ],
          ...(sessionUser ? { id: { not: sessionUser.userId } } : {}),
          ...(pendingUserId ? { id: { not: pendingUserId } } : {}),
        },
      });
      if (existingPhone) {
        return NextResponse.json(
          {
            error: `This phone number is already registered to an existing ${
              role === "VENDOR" ? "Campus Vendor" : "Student Buyer"
            } account. Please sign in or use another number.`,
          },
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
          { error: "Non-Student Vendor registration is currently disabled for this campus. Student vendors only." },
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
            { error: "Non-Student Vendor capacity cap reached for this campus. Please contact campus admin." },
            { status: 403 }
          );
        }
      }
    }

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
    if (sellerType === "student" && studentIdUrl) {
      verificationTier = 2;
    }

    // Payout delay: 72 hours for guest sellers (students get 48 hours)
    const payoutDelayHours = sellerType === "guest" ? 72 : 48;

    let finalCampusId: string | null = null;
    let finalStoreName = "";
    let uniqueSlug = "";
    let finalWhatsapp = "";

    if (role === "VENDOR") {
      finalStoreName = storeName?.trim() || businessName?.trim() || `${fullName}'s Store`;
      finalWhatsapp = cleanWhatsapp || cleanPhone || "";

      if (!finalWhatsapp) {
        return NextResponse.json(
          { error: "A WhatsApp phone number is required for vendors to coordinate customer meetups" },
          { status: 400 }
        );
      }

      // Validate campusId against database before opening transaction
      let targetCampus = campusId
        ? await prisma.campus.findUnique({ where: { id: campusId } })
        : null;

      if (!targetCampus) {
        targetCampus = await prisma.campus.findFirst({
          where: { isActive: true },
          orderBy: { name: "asc" },
        });
      }

      if (!targetCampus) {
        return NextResponse.json(
          { error: "No active campus found in the system" },
          { status: 400 }
        );
      }
      finalCampusId = targetCampus.id;

      // Compute unique slug in one fast query before transaction
      const baseSlug = slugify(finalStoreName);
      const existingVendors = await prisma.vendorProfile.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true },
      });
      const existingSlugs = new Set(existingVendors.map((v) => v.slug));
      uniqueSlug = baseSlug;
      let counter = 1;
      while (existingSlugs.has(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Check if authenticated session user already has vendor profile
    if (sessionUser && role === "VENDOR") {
      const existingUserWithProfile = await prisma.user.findUnique({
        where: { id: sessionUser.userId },
        include: { vendorProfile: true },
      });
      if (existingUserWithProfile?.vendorProfile) {
        return NextResponse.json({
          success: true,
          user: existingUserWithProfile,
          redirectTo: "/dashboard",
        });
      }
    }

    const passwordHash = password ? await hashPassword(password) : null;

    // Create or update user and vendor profile in a transaction with extended timeout for cloud Supabase
    const newUser = await prisma.$transaction(
      async (tx) => {
        let user;
        if (sessionUser) {
          user = await tx.user.update({
            where: { id: sessionUser.userId },
            data: {
              role,
              fullName: fullName || undefined,
              phone: cleanPhone || undefined,
              avatarUrl: studentIdUrl || undefined,
            },
          });
        } else if (pendingUserId) {
          user = await tx.user.update({
            where: { id: pendingUserId },
            data: {
              fullName,
              passwordHash: passwordHash || undefined,
              phone: cleanPhone || null,
              role,
              avatarUrl: studentIdUrl || null,
            },
          });
        } else {
          user = await tx.user.create({
            data: {
              fullName,
              email: userEmail,
              passwordHash,
              phone: cleanPhone || null,
              role,
              avatarUrl: studentIdUrl || null,
            },
          });
        }

        if (role === "VENDOR" && finalCampusId) {
          let vendorProfileId: string | null = null;
          if (pendingUserId && existingEmail?.vendorProfile) {
            await tx.vendorProfile.update({
              where: { id: existingEmail.vendorProfile.id },
              data: {
                storeName: finalStoreName,
                slug: uniqueSlug,
                campusId: finalCampusId,
                whatsapp: finalWhatsapp,
                storeDescription: storeDescription || null,
                sellerType,
                businessName: businessName || finalStoreName,
                businessCategory: businessCategory || null,
                status: vendorStatus as any,
              },
            });
            vendorProfileId = existingEmail.vendorProfile.id;
          } else {
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
                adminNotes: (studentIdNumber || studentId) ? `Matric / Student ID: ${studentIdNumber || studentId}` : null,
                // Guest fields
                businessName: businessName || finalStoreName,
                businessCategory: businessCategory || null,
                businessAddress: businessAddress || null,
                businessPhotoPath: businessPhotoPath || null,
                cacNumber: cacNumber || null,
                cacDocumentPath: cacDocumentPath || null,
                isRegisteredBusiness: Boolean(cacNumber || cacDocumentPath),
                governmentIdType: governmentIdType || null,
                idDocumentPath: idDocumentPath || null,
                selfieDocumentPath: selfieDocumentPath || null,
                vouchedBy: vouchedBy || null,
                status: vendorStatus as any,
              },
            });
            vendorProfileId = vendorProfile.id;
          }

          // If vouched by an existing user/vendor, record vouch entry
          if (vouchedBy && vendorProfileId) {
            const voucherUser = await tx.user.findUnique({
              where: { id: vouchedBy },
            });
            if (voucherUser) {
              await tx.vouch.create({
                data: {
                  voucherId: voucherUser.id,
                  guestId: vendorProfileId,
                  status: "ACCEPTED",
                  notes: `Vouched at registration for ${finalStoreName}`,
                },
              });
            }
          }
        }

        return user;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    // Attribute referral to campus ambassador if code or cookie present
    try {
      await attributeReferral({
        newUserId: newUser.id,
        role: newUser.role as "BUYER" | "VENDOR",
        explicitCode: referralCode || null,
      });
    } catch (refErr) {
      console.error("Referral attribution error:", refErr);
    }

    // Dispatch email verification OTP and email only for new unverified accounts
    const requestUrl = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
    const proto = request.headers.get("x-forwarded-proto") || (requestUrl.protocol.replace(":", "") || "http");
    const origin = `${proto}://${host}`;

    const isAlreadyVerified = Boolean(sessionUser || newUser.emailVerified);

    if (!isAlreadyVerified && newUser.email && !newUser.email.endsWith("@guest.campustrade.ng")) {
      try {
        await createAndSendVerificationEmail({
          userId: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          origin,
        });

        // If vendor registration, dispatch vendor acknowledgement & super admin alert
        if (newUser.role === "VENDOR") {
          const vStore = storeName || businessName || `${newUser.fullName}'s Store`;
          notificationService.notifyVendorRegistrationReceived({
            email: newUser.email,
            storeName: vStore,
            vendorName: newUser.fullName,
          }).catch(() => {});

          notificationService.notifyAdminNewVendor({
            storeName: vStore,
            applicantName: newUser.fullName,
            sellerType: sellerType || "student",
          }).catch(() => {});

          if (cacNumber || cacDocumentPath || idDocumentPath) {
            notificationService.notifyAdminKycSubmitted({
              storeName: vStore,
              vendorName: newUser.fullName,
              documentType: cacNumber ? "CAC Business Registration" : "Government ID Document",
            }).catch(() => {});
          }
        }
      } catch (emailErr) {
        console.error("Failed to dispatch email verification on registration:", emailErr);
      }
    }

    const token = signToken({
      userId: newUser.id,
      role: newUser.role,
      activeRole: newUser.role,
      email: newUser.email,
    });

    const response = NextResponse.json({
      success: true,
      requiresVerification: !isAlreadyVerified,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      redirectTo: isAlreadyVerified
        ? (newUser.role === "VENDOR" ? "/dashboard" : "/shop")
        : `/auth/verify-email?email=${encodeURIComponent(newUser.email)}`,
    });

    if (isAlreadyVerified) {
      response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || proto === "https",
        sameSite: "lax",
        path: "/",
        maxAge: AUTH_COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
