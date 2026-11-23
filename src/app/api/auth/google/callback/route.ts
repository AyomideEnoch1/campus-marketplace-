import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from "@/lib/auth";
import {
  exchangeGoogleCodeForTokens,
  fetchGoogleUserProfile,
  getGoogleCallbackUrl,
  GOOGLE_STATE_COOKIE_NAME,
  sanitizeRedirectUrl,
  verifyAndDecodeOAuthState,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || (requestUrl.protocol.replace(":", "") || "http");
  const appBaseUrl = `${proto}://${host}`.replace(/\/$/, "");
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  // 1. Handle user cancellation or errors returned by Google
  if (error) {
    console.warn("[Google OAuth Callback] Google returned an error:", error);
    const redirectUrl = new URL("/auth/login", appBaseUrl);
    redirectUrl.searchParams.set("error", error === "access_denied" ? "cancelled" : error);
    const res = NextResponse.redirect(redirectUrl.toString());
    res.cookies.delete(GOOGLE_STATE_COOKIE_NAME);
    return res;
  }

  // 2. Validate code and state presence
  if (!code || !state) {
    const redirectUrl = new URL("/auth/login", appBaseUrl);
    redirectUrl.searchParams.set("error", "missing_code_or_state");
    const res = NextResponse.redirect(redirectUrl.toString());
    res.cookies.delete(GOOGLE_STATE_COOKIE_NAME);
    return res;
  }

  // 3. Verify state against HTTP-only cookie to prevent CSRF
  const cookieStore = cookies();
  const cookieState = cookieStore.get(GOOGLE_STATE_COOKIE_NAME)?.value || null;
  const statePayload = verifyAndDecodeOAuthState(state, cookieState);

  if (!statePayload) {
    console.warn("[Google OAuth Callback] State verification failed or state expired.");
    const redirectUrl = new URL("/auth/login", appBaseUrl);
    redirectUrl.searchParams.set("error", "invalid_state");
    const res = NextResponse.redirect(redirectUrl.toString());
    res.cookies.delete(GOOGLE_STATE_COOKIE_NAME);
    return res;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[Google OAuth Callback] Missing Google client credentials in environment.");
    const redirectUrl = new URL("/auth/login", appBaseUrl);
    redirectUrl.searchParams.set("error", "server_config_error");
    const res = NextResponse.redirect(redirectUrl.toString());
    res.cookies.delete(GOOGLE_STATE_COOKIE_NAME);
    return res;
  }

  const redirectUri = getGoogleCallbackUrl(appBaseUrl);

  try {
    // 4. Exchange code for Google tokens
    const tokens = await exchangeGoogleCodeForTokens({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    // 5. Fetch verified Google user profile
    const profile = await fetchGoogleUserProfile(tokens.access_token);

    if (!profile.email) {
      const redirectUrl = new URL("/auth/login", appBaseUrl);
      redirectUrl.searchParams.set("error", "no_email_provided");
      const res = NextResponse.redirect(redirectUrl.toString());
      res.cookies.delete(GOOGLE_STATE_COOKIE_NAME);
      return res;
    }

    // Server-side email verification requirement: Never trust unverified emails
    if (!profile.email_verified) {
      console.warn("[Google OAuth Callback] Rejected unverified Google email:", profile.email);
      const redirectUrl = new URL("/auth/login", appBaseUrl);
      redirectUrl.searchParams.set("error", "email_not_verified");
      const res = NextResponse.redirect(redirectUrl.toString());
      res.cookies.delete(GOOGLE_STATE_COOKIE_NAME);
      return res;
    }

    const normalizedEmail = profile.email.toLowerCase().trim();

    // 6. Check existing user(s) in Prisma database
    const existingUsers = await prisma.user.findMany({
      where: { email: normalizedEmail },
      include: {
        vendorProfile: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    let targetUser: any = null;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // User already exists: Preserve their existing account and role
      if (statePayload.roleIntent) {
        targetUser =
          existingUsers.find((u) => u.role === statePayload.roleIntent) ||
          existingUsers.find((u) => u.vendorProfile || u.role === "VENDOR") ||
          existingUsers[0];
      } else {
        targetUser =
          existingUsers.find((u) => u.vendorProfile || u.role === "VENDOR") ||
          existingUsers[0];
      }

      // Safe update: Only update emailVerified timestamp and avatarUrl if missing
      // NEVER overwrite or modify existing passwordHash
      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          emailVerified: targetUser.emailVerified || new Date(),
          avatarUrl: targetUser.avatarUrl || profile.picture || null,
        },
      });
    } else {
      // User does NOT exist: Create new user record
      isNewUser = true;
      const initialRole = "BUYER"; // Base role is BUYER; vendors proceed to vendor onboarding

      targetUser = await prisma.user.create({
        data: {
          fullName: profile.name || "Campus Member",
          email: normalizedEmail,
          role: initialRole,
          passwordHash: null, // OAuth users have null passwordHash
          emailVerified: new Date(), // Verified by Google
          avatarUrl: profile.picture || null,
        },
        include: {
          vendorProfile: true,
        },
      });
    }

    // 7. Sign standard JWT session token
    const token = signToken({
      userId: targetUser.id,
      role: targetUser.role,
      email: targetUser.email,
    });

    // 8. Determine destination
    let destination = "/shop";

    if (isNewUser) {
      if (statePayload.roleIntent === "VENDOR") {
        // User explicitly registered as vendor -> Direct to consolidated vendor onboarding
        const sellerTypeParam = statePayload.sellerType ? `&sellerType=${statePayload.sellerType}` : "";
        destination = `/auth/register?onboarding=vendor${sellerTypeParam}`;
      } else if (!statePayload.roleIntent) {
        // Authenticated before selecting role -> Continuation screen to choose role
        destination = "/auth/role-select";
      } else {
        destination = statePayload.redirect || "/shop";
      }
    } else {
      // Existing user: Route according to their established role
      if (statePayload.redirect && statePayload.redirect !== "/shop") {
        destination = sanitizeRedirectUrl(statePayload.redirect);
      } else if (targetUser.role === "ADMIN" || targetUser.role === "SUPERADMIN") {
        destination = "/admin";
      } else if (targetUser.role === "VENDOR" || targetUser.vendorProfile) {
        destination = "/dashboard";
      } else if (statePayload.roleIntent === "VENDOR" && !targetUser.vendorProfile) {
        // Existing user attempting vendor onboarding who does not yet have a storefront
        const sellerTypeParam = statePayload.sellerType ? `&sellerType=${statePayload.sellerType}` : "";
        destination = `/auth/register?onboarding=vendor${sellerTypeParam}`;
      } else {
        destination = "/shop";
      }
    }

    const response = NextResponse.redirect(new URL(destination, appBaseUrl).toString());

    // 9. Set secure HTTP-only session cookie (identical to existing login/register)
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || proto === "https",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE, // 30 days
    });

    // Delete state cookie
    response.cookies.delete(GOOGLE_STATE_COOKIE_NAME);

    return response;
  } catch (err: any) {
    console.error("[Google OAuth Callback Error]:", err);
    const redirectUrl = new URL("/auth/login", appBaseUrl);
    redirectUrl.searchParams.set("error", "auth_failed");
    const res = NextResponse.redirect(redirectUrl.toString());
    res.cookies.delete(GOOGLE_STATE_COOKIE_NAME);
    return res;
  }
}
