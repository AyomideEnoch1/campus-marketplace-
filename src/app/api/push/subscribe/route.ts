import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { savePushSubscription } from "@/lib/web-push";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: "You must be signed in to enable device notifications. Please log in to your account first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid push subscription object" },
        { status: 400 }
      );
    }

    const success = await savePushSubscription(session.id, subscription);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to persist device subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Device push notifications enabled successfully",
    });
  } catch (error: any) {
    console.error("[Push Subscribe API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
