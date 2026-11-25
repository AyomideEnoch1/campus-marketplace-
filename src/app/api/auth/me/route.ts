import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { user: null },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } }
  );
}
