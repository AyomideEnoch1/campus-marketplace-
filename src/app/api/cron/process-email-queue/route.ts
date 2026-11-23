export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { processEmailQueueBatch } from "@/lib/email/queue-processor";

export async function GET(req: NextRequest) {
  // Validate authorization header if CRON_SECRET is configured
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const urlSecret = req.nextUrl.searchParams.get("secret");
    if (urlSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized cron caller" }, { status: 401 });
    }
  }

  const batchSize = Number(req.nextUrl.searchParams.get("batchSize") || "25");
  const summary = await processEmailQueueBatch(batchSize);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    summary,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
