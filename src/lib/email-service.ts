import { prisma } from "@/lib/prisma";
import {
  signEmailVerificationToken,
  verifyEmailVerificationToken,
} from "@/lib/auth";
import {
  sendEmailVerificationEmail,
  sendWelcomeEmail,
} from "@/lib/email";

export function getAppBaseUrl(origin?: string): string {
  if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    return origin.replace(/\/$/, "");
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/$/, "");
  }
  return origin ? origin.replace(/\/$/, "") : "https://xn--j-sfa590u.com";
}

/**
 * Generate 6-digit verification code, JWT token, store in SiteSetting, and send email
 */
export async function createAndSendVerificationEmail({
  userId,
  email,
  fullName,
  origin,
}: {
  userId: string;
  email: string;
  fullName?: string;
  origin?: string;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  // Generate random 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Sign JWT token valid for 24 hours
  const token = signEmailVerificationToken({
    userId,
    email: normalizedEmail,
    code,
  });

  const baseUrl = getAppBaseUrl(origin);
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

  // Store code in SiteSetting with expiration timestamp (24h)
  try {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    await prisma.siteSetting.upsert({
      where: { key: `email_otp:${normalizedEmail}` },
      create: {
        key: `email_otp:${normalizedEmail}`,
        value: JSON.stringify({ code, userId, expiresAt }),
      },
      update: {
        value: JSON.stringify({ code, userId, expiresAt }),
      },
    });
  } catch (err) {
    console.error("[Email Verification] Failed to store OTP in SiteSetting:", err);
  }

  // Send the verification email
  const emailResult = await sendEmailVerificationEmail(normalizedEmail, {
    userName: fullName || "Campus Member",
    verificationCode: code,
    verifyUrl,
  });

  return {
    success: true,
    token,
    code,
    emailResult,
  };
}

/**
 * Verify email address either by signed JWT token or by 6-digit code
 */
export async function verifyEmailAddress({
  token,
  code,
  email,
}: {
  token?: string;
  code?: string;
  email?: string;
}): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  // Method 1: Verify via signed JWT token
  if (token) {
    const payload = verifyEmailVerificationToken(token.trim());
    if (!payload || !payload.userId) {
      return {
        success: false,
        error: "This verification link is invalid or has expired.",
      };
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { vendorProfile: true },
      });

      if (!user) {
        return { success: false, error: "Account not found." };
      }

      const normEmail = (user.email || payload.email).toLowerCase().trim();

      // Ensure all accounts associated with this email address are marked verified
      await prisma.user.updateMany({
        where: { email: { equals: normEmail, mode: "insensitive" } },
        data: { emailVerified: new Date() },
      });

      // Clean up any pending OTP setting
      await prisma.siteSetting.deleteMany({
        where: { key: `email_otp:${normEmail}` },
      }).catch(() => {});

      const updatedUser = {
        ...user,
        emailVerified: new Date(),
      };

      return { success: true, user: updatedUser };
    } catch (err: any) {
      console.error("[Email Verification Token Error]:", err);
      return { success: false, error: "Database error during verification." };
    }
  }

  // Method 2: Verify via 6-digit code and email
  if (code && email) {
    const cleanCode = code.trim().replace(/\s+/g, "");
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const otpSetting = await prisma.siteSetting.findUnique({
        where: { key: `email_otp:${normalizedEmail}` },
      });

      if (!otpSetting) {
        return {
          success: false,
          error: "No active verification code found for this email. Please request a new one.",
        };
      }

      let parsed: { code: string; userId: string; expiresAt: number };
      try {
        parsed = JSON.parse(otpSetting.value);
      } catch {
        return { success: false, error: "Invalid verification code state." };
      }

      if (Date.now() > parsed.expiresAt) {
        return {
          success: false,
          error: "Verification code has expired. Please request a new code.",
        };
      }

      if (parsed.code !== cleanCode) {
        return {
          success: false,
          error: "Incorrect 6-digit verification code. Please check your email.",
        };
      }

      // Mark all accounts with this email as verified
      await prisma.user.updateMany({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        data: { emailVerified: new Date() },
      });

      const user = await prisma.user.findUnique({
        where: { id: parsed.userId },
        include: { vendorProfile: true },
      });

      if (!user) {
        return { success: false, error: "Account not found." };
      }

      // Remove the OTP record
      await prisma.siteSetting.delete({
        where: { key: `email_otp:${normalizedEmail}` },
      }).catch(() => {});

      return {
        success: true,
        user: {
          ...user,
          emailVerified: new Date(),
        },
      };
    } catch (err: any) {
      console.error("[Email Verification Code Error]:", err);
      return { success: false, error: "Database error during code verification." };
    }
  }

  return { success: false, error: "Missing verification token or code." };
}

/**
 * Dispatch welcome email upon sign-in (safely only once per user)
 */
export async function sendWelcomeOnSignIn({
  userId,
  email,
  fullName,
  role,
  origin,
}: {
  userId: string;
  email: string;
  fullName?: string;
  role?: string;
  origin?: string;
}) {
  if (!email || !userId) return;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check if welcome email was already recorded
    const key = `welcome_sent:${userId}`;
    const alreadySent = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (alreadySent) {
      return { alreadySent: true };
    }

    const baseUrl = getAppBaseUrl(origin);
    const exploreUrl = role === "VENDOR" ? `${baseUrl}/dashboard` : `${baseUrl}/shop`;

    // Record that we are sending the welcome email to prevent duplicates
    await prisma.siteSetting.upsert({
      where: { key },
      create: {
        key,
        value: new Date().toISOString(),
      },
      update: {},
    });

    // Send the Welcome Email
    await sendWelcomeEmail(normalizedEmail, {
      userName: fullName || "Campus Member",
      userRole: role,
      exploreUrl,
    });

    return { sent: true };
  } catch (err) {
    console.error("[Welcome Email Error]:", err);
    return { error: err };
  }
}
