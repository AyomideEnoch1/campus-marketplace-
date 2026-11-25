import { NextResponse } from "next/server";
import { recordReferralClick } from "@/lib/referral";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`ref:track:${ip}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ success: true, throttled: true });
    }

    const { code } = await request.json().catch(() => ({}));
    if (code && typeof code === "string") {
      await recordReferralClick(code);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Code missing" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to record click" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`ref:track:${ip}`, 20, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ success: true, throttled: true });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || searchParams.get("ref");
  if (code) {
    await recordReferralClick(code);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false }, { status: 400 });
}
