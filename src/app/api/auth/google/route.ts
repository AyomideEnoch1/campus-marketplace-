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
  try {
    const { searchParams } = new URL(request.url);
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("[Google OAuth] GOOGLE_CLIENT_ID is not configured in environment variables.");
      return NextResponse.json(
        {
          error:
            "Google Sign-In is not configured yet. Missing GOOGLE_CLIENT_ID in environment settings.",
        },
        { status: 500 }
      );
    }

    const rawRole = searchParams.get("role")?.toUpperCase();
    const roleIntent =
      rawRole === "VENDOR" || rawRole === "BUYER" ? (rawRole as "BUYER" | "VENDOR") : undefined;

    const rawRedirect = searchParams.get("redirect");
    const redirect = rawRedirect ? sanitizeRedirectUrl(rawRedirect) : undefined;

    const redirectUri = getGoogleCallbackUrl();

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
    return NextResponse.json(
      { error: "Failed to initiate Google authentication" },
      { status: 500 }
    );
  }
}
