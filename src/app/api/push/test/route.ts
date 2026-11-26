import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendPushNotificationToUser, savePushSubscription } from "@/lib/web-push";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: "You must be signed in to test device notifications. Please log in to your account first." },
        { status: 401 }
      );
    }

    let saved = false;
    try {
      const body = await request.json().catch(() => null);
      if (body?.subscription) {
        saved = await savePushSubscription(session.id, body.subscription);
      }
    } catch {}

    const res = await sendPushNotificationToUser(session.id, {
      title: "🎉 Device Notification Active!",
      body: "You will now receive instant drop-down alerts on this device whenever an order is placed or a message arrives.",
      url: "/dashboard/orders",
      tag: "test-alert",
    });

    if (res.sent === 0) {
      if (res.failed > 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Push service failed to deliver to this device. Please ensure your browser allows notifications, incognito mode is disabled, and battery saver is off.",
          },
          { status: 400 }
        );
      }
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
