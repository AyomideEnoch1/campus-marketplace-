export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendVerificationEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const body = await request.json();
    const rawEmail = body?.email ? String(body.email).trim() : "";

    if (!rawEmail) {
      return NextResponse.json(
        { error: "Email address is required to resend verification." },
        { status: 400 }
      );
    }

    const normalizedEmail = rawEmail.toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, email: true, fullName: true, emailVerified: true },
    });

    if (!user) {
      // Return success anyway for security so attackers cannot probe registered emails
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a new verification code has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Your email address is already verified.",
      });
    }

    // Rate limiting: Check if an OTP was sent in the last 45 seconds
    const existingOtpSetting = await prisma.siteSetting.findUnique({
      where: { key: `email_otp:${normalizedEmail}` },
    });
    if (existingOtpSetting) {
      try {
        const parsed = JSON.parse(existingOtpSetting.value);
        // expiresAt is Date.now() + 24 * 60 * 60 * 1000
        const createdAt = (parsed.expiresAt || 0) - 24 * 60 * 60 * 1000;
        const timeSince = Date.now() - createdAt;
        if (timeSince < 45000) {
          const secondsRemaining = Math.ceil((45000 - timeSince) / 1000);
          return NextResponse.json(
            { error: `Please wait ${secondsRemaining}s before requesting a new code.` },
            { status: 429 }
          );
        }
      } catch {}
    }

    // Generate fresh OTP, JWT token and dispatch email via Resend
    await createAndSendVerificationEmail({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      origin: requestUrl.origin,
    });

    return NextResponse.json({
      success: true,
      message: "A fresh 6-digit verification code and link has been sent to your email.",
    });
  } catch (err: any) {
    console.error("POST /api/auth/resend-verification error:", err);
    return NextResponse.json(
      { error: "Failed to resend verification email. Please try again later." },
      { status: 500 }
    );
  }
}
