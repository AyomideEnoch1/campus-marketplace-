export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { verifyEmailAddress, sendWelcomeOnSignIn } from "@/lib/email-service";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/verify-email?status=invalid", requestUrl.origin));
  }

  const result = await verifyEmailAddress({ token });
  if (!result.success || !result.user) {
    const status = result.error?.includes("expired") ? "expired" : "invalid";
    return NextResponse.redirect(new URL(`/auth/verify-email?status=${status}`, requestUrl.origin));
  }

  // Trigger welcome email upon successful verification
  sendWelcomeOnSignIn({
    userId: result.user.id,
    email: result.user.email,
    fullName: result.user.fullName,
    role: result.user.role,
    origin: requestUrl.origin,
  }).catch((err) => console.error("Welcome email error:", err));

  const response = NextResponse.redirect(new URL("/auth/verify-email?status=success", requestUrl.origin));

  // Automatically authenticate user
  const sessionToken = signToken({
    userId: result.user.id,
    role: result.user.role,
    email: result.user.email,
  });

  response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const body = await request.json();
    const token = body?.token ? String(body.token).trim() : undefined;
    const code = body?.code ? String(body.code).trim() : undefined;
    const email = body?.email ? String(body.email).trim() : undefined;

    if (!token && (!code || !email)) {
      return NextResponse.json(
        { error: "Please provide either the verification token or your 6-digit code with email." },
        { status: 400 }
      );
    }

    const result = await verifyEmailAddress({ token, code, email });
    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || "Verification failed." },
        { status: 400 }
      );
    }

    // Trigger welcome email upon successful verification
    sendWelcomeOnSignIn({
      userId: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
      origin: requestUrl.origin,
    }).catch((err) => console.error("Welcome email error:", err));

    const sessionToken = signToken({
      userId: result.user.id,
      role: result.user.role,
      email: result.user.email,
    });

    const isVendor = result.user.role === "VENDOR";
    const redirectTo = isVendor ? "/dashboard" : "/shop";

    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now access all features.",
      redirectTo,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("POST /api/auth/verify-email error:", err);
    return NextResponse.json(
      { error: "Failed to verify email address. Please try again." },
      { status: 500 }
    );
  }
}
