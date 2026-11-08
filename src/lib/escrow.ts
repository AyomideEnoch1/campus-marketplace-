import { prisma } from "@/lib/prisma";

export interface PayoutDelayConfig {
  delayHours: number;
  reason: string;
}

/**
 * Determines payout delay hours based on seller type, tier, and earned trust.
 * - New Guest Sellers: 72 hours
 * - Student Sellers: 48 hours
 * - Earned Trust / Trusted Sellers (Tier 4): 24 hours
 */
export function getPayoutDelayConfig(vendor: {
  sellerType?: string | null;
  verificationTier?: number | null;
  isTrustedSeller?: boolean | null;
  payoutDelayHours?: number | null;
}): PayoutDelayConfig {
  if (vendor.payoutDelayHours && vendor.payoutDelayHours > 0) {
    return {
      delayHours: vendor.payoutDelayHours,
      reason: "Custom profile configured delay",
    };
  }

  // Tier 4 or Trusted Seller: shortened delay
  if (vendor.isTrustedSeller || (vendor.verificationTier && vendor.verificationTier >= 4)) {
    return {
      delayHours: 24,
      reason: "Shortened delay for Tier 4 Trusted Seller with proven reputation",
    };
  }

  // Guest Seller (Tier 1 - 3): 72 hours safeguard
  if (vendor.sellerType === "guest") {
    return {
      delayHours: 72,
      reason: "72-hour escrow hold for guest / off-campus vendor protection",
    };
  }

  // Student Seller (Default): 48 hours
  return {
    delayHours: 48,
    reason: "Standard 48-hour escrow hold for campus student vendor",
  };
}

/**
 * Calculates the exact timestamp when escrow funds can be released to the seller.
 */
export function calculateEligiblePayoutDate(
  orderDate: Date,
  vendor: {
    sellerType?: string | null;
    verificationTier?: number | null;
    isTrustedSeller?: boolean | null;
    payoutDelayHours?: number | null;
  }
): { eligibleDate: Date; delayHours: number; reason: string } {
  const { delayHours, reason } = getPayoutDelayConfig(vendor);
  const eligibleDate = new Date(orderDate.getTime() + delayHours * 60 * 60 * 1000);
  return { eligibleDate, delayHours, reason };
}

/**
 * Check if order is eligible for payout release
 */
export async function checkOrderPayoutStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      vendor: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const { eligibleDate, delayHours, reason } = calculateEligiblePayoutDate(
    order.createdAt,
    order.vendor
  );

  const now = new Date();
  const isEligible =
    (order.status === "CONFIRMED" || order.status === "DELIVERED") &&
    now >= eligibleDate;

  const remainingMs = Math.max(0, eligibleDate.getTime() - now.getTime());
  const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    totalAmount: order.totalAmount,
    sellerType: order.vendor.sellerType,
    delayHours,
    reason,
    eligibleDate,
    isEligible,
    remainingHours,
  };
}

/**
 * Release escrow payout to vendor
 */
export async function releaseEscrowPayout(orderId: string, adminUserId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { vendor: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const { isEligible, remainingHours, delayHours } = await checkOrderPayoutStatus(orderId);

  if (!isEligible && !adminUserId) {
    throw new Error(
      `Escrow hold period active. Payout eligible in approximately ${remainingHours} hours (${delayHours}h delay required).`
    );
  }

  // Update order status to DELIVERED or COMPLETED
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "DELIVERED",
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: adminUserId || null,
      action: "ESCROW_PAYOUT_RELEASED",
      entityType: "Order",
      entityId: order.id,
      metadataJson: JSON.stringify({
        orderNumber: order.orderNumber,
        vendorId: order.vendorId,
        storeName: order.vendor.storeName,
        sellerType: order.vendor.sellerType,
        totalAmount: order.totalAmount,
        payoutDelayHours: delayHours,
        releasedBy: adminUserId ? `Admin:${adminUserId}` : "Automated Escrow Release",
      }),
    },
  });

  return updatedOrder;
}
