import { prisma } from "@/lib/prisma";

export * from "./promotions-calc";

/**
 * Database synchronizer: auto-advances scheduled/active statuses on the fly
 */
export async function syncPromotionsLifecycle(vendorId?: string, productId?: string) {
  const now = new Date();

  try {
    // 1. Mark expired promotions
    await prisma.promotion.updateMany({
      where: {
        ...(vendorId ? { vendorId } : {}),
        ...(productId ? { productId } : {}),
        status: { in: ["ACTIVE", "SCHEDULED"] },
        endAt: { lte: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // 2. Activate scheduled promotions whose start time has arrived
    await prisma.promotion.updateMany({
      where: {
        ...(vendorId ? { vendorId } : {}),
        ...(productId ? { productId } : {}),
        status: "SCHEDULED",
        startAt: { lte: now },
        endAt: { gt: now },
      },
      data: {
        status: "ACTIVE",
      },
    });
  } catch (err) {
    console.warn("Failed to sync promotion lifecycle states:", err);
  }
}
