import { prisma } from "@/lib/prisma";
import { sendPushNotificationToUser } from "@/lib/web-push";

export interface CreateNotificationParams {
  userId: string;
  type: "CHAT_MESSAGE" | "ORDER_CREATED" | "ORDER_STATUS" | "ESCROW_RELEASED" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    });

    // Concurrently deliver native OS drop-down push notification to all vendor/user devices
    sendPushNotificationToUser(params.userId, {
      title: params.title,
      body: params.message,
      url: params.link,
      tag: params.type,
    }).catch((err) => {
      console.warn("[WebPush Device Dispatch Warning]:", err?.message || err);
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
