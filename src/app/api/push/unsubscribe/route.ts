import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { removePushSubscription } from "@/lib/web-push";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    await removePushSubscription(session.id, endpoint);

    return NextResponse.json({
      success: true,
      message: "Device unsubscribed successfully",
    });
  } catch (error: any) {
    console.error("[Push Unsubscribe API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
