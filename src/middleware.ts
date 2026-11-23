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
    const effectiveRole = payload.activeRole || payload.role;
    return effectiveRole ? String(effectiveRole).toUpperCase() : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get("campus_market_session")?.value;
  const role = token ? getSessionRole(token) : null;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  // 1. Role: ADMIN routing rules
  if (isAdmin) {
    // If already signed in as admin and visiting admin login, redirect to admin dashboard
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Enforce admin portal access
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!isAdmin) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Role: VENDOR routing rules
  if (role === "VENDOR") {
    // If navigating to sign-in/sign-up without explicit buyer intent, redirect to dashboard
    if (pathname === "/auth/login" || pathname === "/auth/register") {
      const targetRole = searchParams.get("role");
      const onboarding = searchParams.get("onboarding");
      if (targetRole !== "buyer" && onboarding !== "vendor") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // 3. Role: BUYER routing rules
  if (role === "BUYER") {
    // If already signed in as buyer and navigating to sign-in/sign-up, redirect to shop
    if (pathname === "/auth/login" || pathname === "/auth/register") {
      const targetRole = searchParams.get("role");
      if (targetRole !== "vendor") {
        return NextResponse.redirect(new URL("/shop", request.url));
      }
    }
    // Buyers should not view vendor dashboard
    if (pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("role", "vendor");
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Unauthenticated access to protected dashboard
  if (!role && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Attach pathname to request headers for Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
