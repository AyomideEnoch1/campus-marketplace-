import { prisma } from "@/lib/prisma";

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

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
