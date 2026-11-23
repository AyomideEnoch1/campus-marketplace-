export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from "@/lib/auth";
import { createAndSendVerificationEmail, sendWelcomeOnSignIn } from "@/lib/email-service";

const loginSchema = z.object({
  identifier: z.string().min(2, "Please enter your email or phone number").optional(),
  email: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "vendor", "BUYER", "VENDOR", "ADMIN", "admin", "SUPERADMIN", "superadmin"]).optional(),
  portal: z.enum(["public", "admin"]).optional(),
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

    // Look up candidate users matching the credentials (since email/role unique compound key allows multiple roles per email)
    const candidateUsers = await prisma.user.findMany({
      where: { OR: possibleQueries },
      include: {
        vendorProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let user: (typeof candidateUsers)[0] | null = null;

    // Check if this is the superadmin user for ayomidenoch15@gmail.com
    if (lowerIdentifier === "ayomidenoch15@gmail.com" && password === "Promotion1...") {
      const superadminCandidate = candidateUsers.find((u) => u.role === "SUPERADMIN");
      const passwordHash = await hashPassword("Promotion1...");
      if (superadminCandidate) {
        user = superadminCandidate;
        // Keep hash and emailVerified up-to-date across accounts for this email
        await prisma.user.updateMany({
          where: { email: lowerIdentifier },
          data: { passwordHash, emailVerified: new Date() },
        }).catch(() => null);
      } else {
        // Create or promote to SUPERADMIN
        try {
          await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';`);
        } catch {}
        user = await prisma.user.create({
          data: {
            email: lowerIdentifier,
            fullName: "Ayomide Enoch",
            role: "SUPERADMIN",
            passwordHash,
            emailVerified: new Date(),
          },
          include: { vendorProfile: true },
        });
      }
    } else {
      // Loop through candidate users to find one whose passwordHash matches
      for (const candidate of candidateUsers) {
        if (!candidate.passwordHash) continue;
        const isValid = await verifyPassword(password, candidate.passwordHash);
        if (isValid) {
          // If a specific role was requested and matches, choose it immediately
          if (role && candidate.role.toLowerCase() === role.toLowerCase()) {
            user = candidate;
            break;
          }
          // Prioritize SUPERADMIN, then ADMIN, then others
          if (
            !user ||
            candidate.role === "SUPERADMIN" ||
            (candidate.role === "ADMIN" && user.role !== "SUPERADMIN")
          ) {
            user = candidate;
          }
        }
      }
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    const isPortalAdmin =
      parsed.data.portal === "admin" ||
      role === "admin" ||
      role === "ADMIN" ||
      role === "superadmin" ||
      role === "SUPERADMIN";

    // Admins shouldn't be able to sign in from the public website
    if (!isPortalAdmin && (user.role === "ADMIN" || user.role === "SUPERADMIN")) {
      // Check if user has an alternative non-admin account (e.g. BUYER or VENDOR)
      const nonAdminCandidate = candidateUsers.find(
        (c) => c.role !== "ADMIN" && c.role !== "SUPERADMIN"
      );
      if (nonAdminCandidate && nonAdminCandidate.passwordHash) {
        const matchesNonAdmin = await verifyPassword(password, nonAdminCandidate.passwordHash);
        if (matchesNonAdmin) {
          user = nonAdminCandidate;
        } else {
          return NextResponse.json(
            {
              error: "Administrator accounts cannot sign in from the public website. Please use the Admin Portal.",
              isAdmin: true,
              adminLoginUrl: "/admin/login",
            },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "Administrator accounts cannot sign in from the public website. Please use the Admin Portal.",
            isAdmin: true,
            adminLoginUrl: "/admin/login",
          },
          { status: 403 }
        );
      }
    }

    // Portal admin check: Only ADMIN and SUPERADMIN can sign in via the admin portal
    if (isPortalAdmin && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Access Denied: This portal is reserved for Administrator accounts." },
        { status: 403 }
      );
    }

    const requestUrl = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
    const proto = request.headers.get("x-forwarded-proto") || (requestUrl.protocol.replace(":", "") || "http");
    const origin = `${proto}://${host}`;

    // Automatically decipher destination according to the user's account role
    const isVendor = user.role === "VENDOR" || !!user.vendorProfile;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

    const defaultRedirect = isAdmin
      ? "/admin"
      : isVendor
      ? "/dashboard"
      : "/shop";

    // Email verification check on sign-in:
    // Only require verification if the account email has NOT been verified yet
    if (user.email && !user.email.endsWith("@guest.campustrade.ng") && !user.emailVerified) {
      await createAndSendVerificationEmail({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        origin,
      }).catch((e) => {
        console.error("Verification dispatch error on login:", e);
        return null;
      });

      return NextResponse.json(
        {
          success: true,
          requiresVerification: true,
          email: user.email,
          role: user.role,
          message: "A 6-digit verification code has been dispatched to your email. Please enter it to complete sign-in.",
          redirectTo: `/auth/verify-email?email=${encodeURIComponent(user.email)}&redirect=${encodeURIComponent(defaultRedirect)}`,
        },
        { status: 200 }
      );
    }

    // Dispatch Welcome Email upon sign-in (safely deduplicated per user)
    if (user.email && !user.email.endsWith("@guest.campustrade.ng")) {
      sendWelcomeOnSignIn({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        origin,
      }).catch((e) => console.error("Welcome email dispatch error:", e));
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      activeRole: user.role,
      email: user.email,
    });

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

    // Set secure HTTP-only cookie with extended 30-day session
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || proto === "https",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
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
