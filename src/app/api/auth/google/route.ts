import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  generateOAuthState,
  getGoogleCallbackUrl,
  GOOGLE_STATE_COOKIE_NAME,
  sanitizeRedirectUrl,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
  const proto = request.headers.get("x-forwarded-proto") || (requestUrl.protocol.replace(":", "") || "http");
  const appBaseUrl = `${proto}://${host}`.replace(/\/$/, "");
  const referer = request.headers.get("referer");
  let fallbackPath = "/auth/login";
  if (referer) {
    try {
      fallbackPath = new URL(referer).pathname;
    } catch {}
  }

  try {
    const { searchParams } = requestUrl;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn("[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured in .env.");
      const redirectUrl = new URL(fallbackPath, appBaseUrl);
      redirectUrl.searchParams.set("error", "server_config_error");
      return NextResponse.redirect(redirectUrl.toString());
    }

    const rawRole = searchParams.get("role")?.toUpperCase();
    const roleIntent =
      rawRole === "VENDOR" || rawRole === "BUYER" ? (rawRole as "BUYER" | "VENDOR") : undefined;

    const rawRedirect = searchParams.get("redirect");
    const redirect = rawRedirect ? sanitizeRedirectUrl(rawRedirect) : undefined;

    const redirectUri = getGoogleCallbackUrl(appBaseUrl);

    // Generate signed, tamper-resistant state
    const { stateString, cookieValue } = generateOAuthState({
      roleIntent,
      redirect,
    });

    const googleAuthUrl = buildGoogleAuthUrl({
      clientId,
      redirectUri,
      state: stateString,
    });

    const response = NextResponse.redirect(googleAuthUrl);

    // Set secure HTTP-only state cookie
    response.cookies.set(GOOGLE_STATE_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error: any) {
    console.error("[Google OAuth Init Error]:", error);
    const redirectUrl = new URL(fallbackPath, appBaseUrl);
    redirectUrl.searchParams.set("error", "server_config_error");
    return NextResponse.redirect(redirectUrl.toString());
  }
}
