export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from "@/lib/auth";
import { verifyEmailAddress, sendWelcomeOnSignIn } from "@/lib/email-service";

function getRequestOrigin(request: Request): { origin: string; isHttps: boolean } {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || (requestUrl.protocol.replace(":", "") || "https");
  const isHttps = proto === "https" || process.env.NODE_ENV === "production";
  const origin = `${proto}://${host}`;
  return { origin, isHttps };
}

export async function GET(request: Request) {
  const { origin, isHttps } = getRequestOrigin(request);
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/verify-email?status=invalid", origin));
  }

  const result = await verifyEmailAddress({ token });
  if (!result.success || !result.user) {
    const status = result.error?.includes("expired") ? "expired" : "invalid";
    return NextResponse.redirect(new URL(`/auth/verify-email?status=${status}`, origin));
  }

  // Trigger welcome email upon successful verification
  sendWelcomeOnSignIn({
    userId: result.user.id,
    email: result.user.email,
    fullName: result.user.fullName,
    role: result.user.role,
    origin,
  }).catch((err) => console.error("Welcome email error:", err));

  const isAdmin = result.user.role === "ADMIN" || result.user.role === "SUPERADMIN";
  const isVendor = result.user.role === "VENDOR" || Boolean(result.user.vendorProfile);
  const activeRole = isAdmin ? result.user.role : isVendor ? "VENDOR" : (result.user.role || "BUYER");
  const targetDashboard = isAdmin ? "/admin" : isVendor ? "/dashboard" : "/shop";

  const response = NextResponse.redirect(
    new URL(`/auth/verify-email?status=success&redirect=${encodeURIComponent(targetDashboard)}`, origin)
  );

  // Automatically authenticate user with 30-day persistent session
  const sessionToken = signToken({
    userId: result.user.id,
    role: activeRole,
    activeRole: activeRole,
    email: result.user.email,
  }, "30d");

  response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

  return response;
}

export async function POST(request: Request) {
  try {
    const { origin, isHttps } = getRequestOrigin(request);
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
      origin,
    }).catch((err) => console.error("Welcome email error:", err));

    const isAdmin = result.user.role === "ADMIN" || result.user.role === "SUPERADMIN";
    const isVendor = result.user.role === "VENDOR" || Boolean(result.user.vendorProfile);
    const activeRole = isAdmin ? result.user.role : isVendor ? "VENDOR" : (result.user.role || "BUYER");
    const redirectTo = isAdmin ? "/admin" : isVendor ? "/dashboard" : "/shop";

    // Automatically authenticate user with 30-day persistent session
    const sessionToken = signToken({
      userId: result.user.id,
      role: activeRole,
      activeRole: activeRole,
      email: result.user.email,
    }, "30d");

    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully! You are now signed in.",
      redirectTo,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: activeRole,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
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
