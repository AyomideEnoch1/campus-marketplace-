import webpush from "web-push";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BGUYmBJlFhHTxcRc7PGjlgQ9xsXYEIqvcxhFa7uzLjrvR7jTqxha1TQk0kPqyaXIx6dXorerGKrMZwg-Z8m5q30";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "FLDdu7etJ_mmI2kzOqc5UfMMmZpcqJt6RFFVpUYWQrk";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@xn--j-sfa590u.com";

// Configure web-push with VAPID credentials
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn("[WebPush Init Warning]:", err);
}

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SendPushOptions {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

/**
 * Return hash key for storing push subscription in SiteSetting
 */
function getSubscriptionKey(userId: string, endpoint: string): string {
  const hash = crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
  return `push_sub:${userId}:${hash}`;
}

/**
 * Save or update a user device push subscription
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionPayload
): Promise<boolean> {
  if (!userId || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return false;
  }

  const key = getSubscriptionKey(userId, subscription.endpoint);
  const value = JSON.stringify({
    ...subscription,
    userId,
    updatedAt: new Date().toISOString(),
  });

  try {
    await prisma.siteSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        description: `Web push device subscription for user ${userId}`,
      },
      update: {
        value,
        description: `Web push device subscription for user ${userId}`,
      },
    });
    return true;
  } catch (error) {
    console.error(`[WebPush Save Error] user=${userId}:`, error);
    return false;
  }
}

/**
 * Remove an existing subscription when unsubscribed
 */
export async function removePushSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  if (!userId || !endpoint) return false;
  const key = getSubscriptionKey(userId, endpoint);
  try {
    await prisma.siteSetting.deleteMany({
      where: { key },
    });
    return true;
  } catch (error) {
    console.error(`[WebPush Remove Error]:`, error);
    return false;
  }
}

/**
 * Send native OS drop-down push notification to all active devices of a user.
 * Automatically cleans up expired/unsubscribed device subscriptions (404/410).
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: SendPushOptions
): Promise<{ sent: number; failed: number }> {
  if (!userId) return { sent: 0, failed: 0 };

  try {
    const prefix = `push_sub:${userId}:`;
    const records = await prisma.siteSetting.findMany({
      where: {
        key: { startsWith: prefix },
      },
      select: {
        id: true,
        key: true,
        value: true,
      },
    });

    if (records.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/dashboard",
      tag: payload.tag || "oja-general",
      icon: payload.icon || "/images/logo.png",
      badge: payload.badge || "/images/logo.png",
    });

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      records.map(async (record) => {
        let subscription: PushSubscriptionPayload | null = null;
        try {
          subscription = JSON.parse(record.value);
        } catch {
          // Bad JSON, delete record
          await prisma.siteSetting.delete({ where: { id: record.id } }).catch(() => null);
          return;
        }

        if (!subscription?.endpoint) return;

        try {
          await webpush.sendNotification(
            subscription as any,
            notificationPayload,
            {
              TTL: 60 * 60 * 24, // 24 hours
              urgency: "high",
            }
          );
          sent++;
        } catch (pushErr: any) {
          failed++;
          const statusCode = pushErr.statusCode;
          // 404 or 410 means subscription has expired or user revoked browser permission
          if (statusCode === 404 || statusCode === 410) {
            await prisma.siteSetting.delete({ where: { id: record.id } }).catch(() => null);
          } else {
            console.warn(`[WebPush Send Error] status=${statusCode}:`, pushErr?.message || pushErr);
          }
        }
      })
    );

    return { sent, failed };
  } catch (error) {
    console.error(`[WebPush Global Error] user=${userId}:`, error);
    return { sent: 0, failed: 0 };
  }
}

export interface NewArrivalPayload {
  id: string;
  title: string;
  price: number;
  slug: string;
  storeName: string;
  sellerUserId?: string;
  campusId?: string | null;
}

/**
 * Broadcast native OS drop-down push notification to registered buyers
 * when a new product is published to the marketplace.
 */
export async function notifyUsersOfNewArrival(
  product: NewArrivalPayload
): Promise<{ sent: number; totalUsers: number }> {
  try {
    const records = await prisma.siteSetting.findMany({
      where: {
        key: { startsWith: "push_sub:" },
      },
      select: {
        id: true,
        key: true,
        value: true,
      },
    });

    if (records.length === 0) {
      return { sent: 0, totalUsers: 0 };
    }

    const userSubscriptions = new Map<string, { id: string; subscription: PushSubscriptionPayload }[]>();

    for (const record of records) {
      try {
        const parts = record.key.split(":");
        const userId = parts[1];
        if (!userId || (product.sellerUserId && userId === product.sellerUserId)) {
          continue;
        }
        const subscription: PushSubscriptionPayload = JSON.parse(record.value);
        if (subscription?.endpoint) {
          const list = userSubscriptions.get(userId) || [];
          list.push({ id: record.id, subscription });
          userSubscriptions.set(userId, list);
        }
      } catch {
        continue;
      }
    }

    const uniqueUserIds = Array.from(userSubscriptions.keys());
    if (uniqueUserIds.length === 0) {
      return { sent: 0, totalUsers: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: "✨ New Arrival on Campus!",
      body: `${product.storeName} just listed "${product.title}" for ₦${product.price.toLocaleString()}!`,
      url: `/products/${product.slug}`,
      tag: `new-arrival-${product.id}`,
      icon: "/images/logo.png",
      badge: "/images/logo.png",
    });

    let totalSent = 0;

    await Promise.allSettled(
      uniqueUserIds.map(async (userId) => {
        // Create in-app notification record
        prisma.notification.create({
          data: {
            userId,
            type: "SYSTEM",
            title: `✨ New Arrival: ${product.title}`,
            message: `${product.storeName} just listed a new item for ₦${product.price.toLocaleString()}`,
            link: `/products/${product.slug}`,
          },
        }).catch(() => null);

        const subs = userSubscriptions.get(userId) || [];
        for (const { id: recordId, subscription } of subs) {
          try {
            await webpush.sendNotification(subscription as any, notificationPayload, {
              TTL: 60 * 60 * 24,
              urgency: "normal",
            });
            totalSent++;
          } catch (pushErr: any) {
            const statusCode = pushErr.statusCode;
            if (statusCode === 404 || statusCode === 410) {
              await prisma.siteSetting.delete({ where: { id: recordId } }).catch(() => null);
            }
          }
        }
      })
    );

    return { sent: totalSent, totalUsers: uniqueUserIds.length };
  } catch (err) {
    console.error("[New Arrival Broadcast Error]:", err);
    return { sent: 0, totalUsers: 0 };
  }
}
