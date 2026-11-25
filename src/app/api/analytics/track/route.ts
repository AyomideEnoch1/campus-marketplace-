import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|headless|lighthouse|pingdom|uptimerobot|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot/i;

const VISITOR_COOKIE = "oja_vid";

function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().split("?")[0].split("#")[0];
  if (!trimmed.startsWith("/")) return null;
  if (
    trimmed.startsWith("/admin") ||
    trimmed.startsWith("/api") ||
    trimmed.startsWith("/_next")
  ) {
    return null;
  }
  return trimmed.slice(0, 200) || "/";
}

export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") || "";
    if (!ua || BOT_UA_PATTERN.test(ua)) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const path = normalizePath(body?.path);
    if (!path) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const ip = getClientIp(request);
    const rl = checkRateLimit(`pv:${ip}:${path}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ ok: true, throttled: true });
    }

    const cookieStore = cookies();
    let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
    const isNewVisitor = !visitorId;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
    }

    await prisma.pageView.create({
      data: {
        path,
        visitorId,
      },
    });

    const response = NextResponse.json({ ok: true });
    if (isNewVisitor) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch {
    // Never fail loudly if analytics table isn't migrated yet
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
