export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetToken, hashPassword } from "@/lib/auth";
import { notificationService } from "@/lib/email/notification-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token ? String(body.token).trim() : "";
    const password = body?.password ? String(body.password) : "";

    if (!token) {
      return NextResponse.json(
        { error: "Reset token is missing or invalid" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "This password reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found or has been removed" },
        { status: 404 }
      );
    }

    // Hash and update the password
    const newPasswordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // Log the security activity & dispatch security alert
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_SUCCESS",
          entityType: "User",
          metadataJson: JSON.stringify({ email: user.email }),
        },
      });

      if (user.email && !user.email.endsWith("@guest.campustrade.ng")) {
        notificationService.notifyBuyerPasswordChanged({
          email: user.email,
          userName: "Campus Member",
        }).catch(() => {});
      }
    } catch (logErr) {
      console.warn("Failed to create activity log for password reset:", logErr);
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successful! You can now sign in with your new password.",
    });
  } catch (err: any) {
    console.error("POST /api/auth/reset-password error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
