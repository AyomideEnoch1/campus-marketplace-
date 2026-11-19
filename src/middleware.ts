import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function getSessionRole(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    return payload.role ? String(payload.role).toUpperCase() : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get("campus_market_session")?.value;
  const role = token ? getSessionRole(token) : null;

  // 1. Role: VENDOR routing rules
  if (role === "VENDOR") {
    // If navigating to the buyer landing page, route vendor directly to their dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If navigating to sign-in/sign-up without explicit buyer intent, redirect to dashboard
    if (pathname === "/auth/login" || pathname === "/auth/register") {
      const targetRole = searchParams.get("role");
      if (targetRole !== "buyer") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // 2. Role: BUYER routing rules
  if (role === "BUYER") {
    // Buyers should not view vendor dashboard
    if (pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("role", "vendor");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Unauthenticated access to protected dashboard
  if (!role && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
