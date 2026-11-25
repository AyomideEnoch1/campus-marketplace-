import { NextResponse } from "next/server";
import { getSession, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) {
    const res = NextResponse.json(
      { user: null },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
    res.cookies.delete(AUTH_COOKIE_NAME);
    return res;
  }
  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } }
  );
}
