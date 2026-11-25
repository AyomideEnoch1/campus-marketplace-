import { NextRequest, NextResponse } from "next/server";
import { runVendorAccessCheck } from "@/lib/vendor-access-job";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    // 1. Authorize: check Bearer token (CRON_SECRET) or SuperAdmin session
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    let isAuthorized = Boolean(cronSecret && bearer === cronSecret);

    if (!isAuthorized) {
      const session = await getSession();
      if (session && (session.role === "SUPERADMIN" || session.role === "ADMIN")) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await runVendorAccessCheck();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err: any) {
    console.error("[Cron Job Route Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute vendor access cron job" },
      { status: 500 }
    );
  }
}
