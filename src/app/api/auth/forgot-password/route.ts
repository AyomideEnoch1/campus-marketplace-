export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signPasswordResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email ? String(body.email).trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Lookup user by email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    // If user exists, generate reset token and dispatch email
    if (user) {
      const token = signPasswordResetToken({
        userId: user.id,
        email: user.email,
      });

      // Determine canonical root URL (using Punycode for production to prevent email clients from stripping Unicode characters to foreign domains like oja.com)
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      const appUrl = isLocal ? `http://${host}` : "https://xn--j-sfa590u.com";

      const resetUrl = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

      await sendPasswordResetEmail(user.email, {
        userName: user.fullName || "Student",
        resetUrl,
      });
    }

    // Always respond with a generic success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account is associated with this email, we have sent password reset instructions to your inbox.",
    });
  } catch (err: any) {
    console.error("POST /api/auth/forgot-password error:", err);
    return NextResponse.json(
      { error: "Failed to process password reset request. Please try again later." },
      { status: 500 }
    );
  }
}
