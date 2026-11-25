import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendPushNotificationToUser } from "@/lib/web-push";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await sendPushNotificationToUser(session.id, {
      title: "🎉 Device Notification Active!",
      body: "You will now receive instant drop-down alerts on this device whenever an order is placed or a message arrives.",
      url: "/dashboard/orders",
      tag: "test-alert",
    });

    if (res.sent === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No active device subscription found for your account. Please click 'Enable Device Notifications' first.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${res.sent} registered device(s)! Check your device screen.`,
      sentCount: res.sent,
    });
  } catch (error: any) {
    console.error("[Push Test API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to trigger test push" },
      { status: 500 }
    );
  }
}
