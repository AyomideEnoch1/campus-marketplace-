import crypto from "crypto";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export const GOOGLE_STATE_COOKIE_NAME = "g_oauth_state";

export interface GoogleTokens {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
  refresh_token?: string;
}

export interface GoogleUserProfile {
  sub: string; // Unique Google User ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  hd?: string; // Present for Google Workspace domains (e.g. unilag.edu.ng)
}

export interface OAuthStatePayload {
  nonce: string;
  roleIntent?: "BUYER" | "VENDOR";
  redirect?: string;
  createdAt: number;
}

/**
 * Returns the effective Google OAuth Callback URL.
 */
export function getGoogleCallbackUrl(): string {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/api/auth/google/callback`;
}

/**
 * Generates a signed, tamper-resistant OAuth state payload and cookie string.
 */
export function generateOAuthState(options: {
  roleIntent?: "BUYER" | "VENDOR";
  redirect?: string;
}): { stateString: string; cookieValue: string } {
  const nonce = crypto.randomBytes(24).toString("hex");
  const payload: OAuthStatePayload = {
    nonce,
    roleIntent: options.roleIntent,
    redirect: sanitizeRedirectUrl(options.redirect),
    createdAt: Date.now(),
  };

  const payloadString = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = process.env.JWT_SECRET || "google-oauth-state-secret-fallback";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("base64url");

  const stateString = `${payloadString}.${signature}`;
  return {
    stateString,
    cookieValue: stateString,
  };
}

/**
 * Validates and decodes the state returned by Google against the signed cookie.
 */
export function verifyAndDecodeOAuthState(
  returnedState: string | null,
  cookieState: string | null
): OAuthStatePayload | null {
  if (!returnedState || !cookieState) return null;
  if (returnedState !== cookieState) return null;

  const parts = returnedState.split(".");
  if (parts.length !== 2) return null;

  const [payloadString, signature] = parts;
  const secret = process.env.JWT_SECRET || "google-oauth-state-secret-fallback";
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const jsonStr = Buffer.from(payloadString, "base64url").toString("utf-8");
    const payload: OAuthStatePayload = JSON.parse(jsonStr);

    // Expire state after 15 minutes
    if (Date.now() - payload.createdAt > 15 * 60 * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Builds the official Google OAuth 2.0 authorization URL.
 * Works with both personal Google accounts (@gmail.com) and Google Workspace accounts.
 */
export function buildGoogleAuthUrl(options: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: options.state,
    access_type: "offline",
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges Google authorization code for tokens.
 */
export async function exchangeGoogleCodeForTokens(options: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    code: options.code,
    client_id: options.clientId,
    client_secret: options.clientSecret,
    redirect_uri: options.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error_description || data.error || "Failed to exchange Google authorization code"
    );
  }

  return data as GoogleTokens;
}

/**
 * Fetches and verifies the authenticated user profile from Google's OpenID UserInfo endpoint.
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Failed to fetch Google user profile");
  }

  return data as GoogleUserProfile;
}

/**
 * Validates that redirect paths are strictly internal relative paths to prevent open redirects.
 */
export function sanitizeRedirectUrl(url: string | null | undefined): string {
  if (!url) return "/shop";
  const trimmed = url.trim();
  // Must start with '/' but not '//' (protocol-relative URL) and must not contain ':'
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes(":")) {
    return trimmed;
  }
  return "/shop";
}
