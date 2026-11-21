import { prisma } from "@/lib/prisma";

export interface PayoutDelayConfig {
  delayHours: number;
  reason: string;
}

/**
 * Determines payout delay hours based on seller type.
 * - Guest Sellers: 72 hours
 * - Student Sellers: 48 hours
 * 
 * Note: Under platform safety rules, the buyer's 48-hour inspection period is strictly inviolable.
 * Even for trusted sellers, release cannot occur before the full 48-hour inspection window.
 */
export function getPayoutDelayConfig(vendor: {
  sellerType?: string | null;
  payoutDelayHours?: number | null;
}): PayoutDelayConfig {
  if (vendor.payoutDelayHours && vendor.payoutDelayHours >= 48) {
    return {
      delayHours: vendor.payoutDelayHours,
      reason: "Custom profile configured delay",
    };
  }

  // Guest Seller: 72 hours safeguard from verified handover
  if (vendor.sellerType === "guest") {
    return {
      delayHours: 72,
      reason: "72-hour escrow hold for guest / off-campus vendor protection",
    };
  }

  // Student Seller (Default): 48 hours from verified handover
  return {
    delayHours: 48,
    reason: "Standard 48-hour escrow hold for campus student vendor",
  };
}

export interface PayoutEligibilityResult {
  eligibleDate: Date;
  isEligible: boolean;
  remainingHours: number;
  sellerDelayHours: number;
  inspectionHours: number; // 48
  effectiveDelayHours: number;
  reason: string;
  disputeBlocked: boolean;
  handoverPending: boolean;
}

/**
 * Calculates effective payout eligibility.
 * 
 * Rules:
 * 1. Clocks start ONLY from verified handover (delivered_at).
 * 2. Buyer inspection period: strictly 48 hours.
 * 3. Seller payout delay: 48 hours for student vendors, 72 hours for guest vendors.
 * 4. Effective eligibility time: the LATER of inspection deadline and seller payout delay.
 *    - Student Vendor: max(48h, 48h) = 48h from verified handover.
 *    - Guest Vendor:   max(48h, 72h) = 72h from verified handover.
 * 5. Active dispute: strictly freezes payout, preventing release regardless of elapsed time.
 */
export function calculateEffectivePayoutEligibility(
  order: {
    delivered_at?: Date | string | null;
    createdAt?: Date | string;
    escrow_status?: string | null;
    dispute?: { status: string } | null;
  },
  vendor: {
    sellerType?: string | null;
    payoutDelayHours?: number | null;
  }
): PayoutEligibilityResult {
  const disputeBlocked = Boolean(
    order.dispute && ["open", "under_review"].includes(order.dispute.status)
  ) || order.escrow_status === "disputed";

  if (!order.delivered_at) {
    const sellerDelayHours = vendor.sellerType === "guest" ? 72 : 48;
    return {
      eligibleDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      isEligible: false,
      remainingHours: 48,
      sellerDelayHours,
      inspectionHours: 48,
      effectiveDelayHours: sellerDelayHours,
      reason: "Item handover has not been verified yet with the 6-digit delivery code.",
      disputeBlocked,
      handoverPending: true,
    };
  }

  const handoverTime = new Date(order.delivered_at).getTime();
  const inspectionHours = 48;
  const sellerDelayHours = vendor.sellerType === "guest" ? 72 : 48;
  const effectiveDelayHours = Math.max(inspectionHours, sellerDelayHours);
  const eligibleDate = new Date(handoverTime + effectiveDelayHours * 60 * 60 * 1000);

  const now = Date.now();
  const isTimeReached = now >= eligibleDate.getTime();
  const isEligible = isTimeReached && !disputeBlocked;

  const remainingMs = Math.max(0, eligibleDate.getTime() - now);
  const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

  let reason = "";
  if (disputeBlocked) {
    reason = "Payout is frozen due to an active dispute on this order.";
  } else if (!isTimeReached) {
    reason = vendor.sellerType === "guest"
      ? `72-hour guest vendor payout delay active. Payout eligible in approximately ${remainingHours} hour(s).`
      : `48-hour buyer inspection period active. Payout eligible in approximately ${remainingHours} hour(s).`;
  } else {
    reason = "Order has cleared the full inspection and payout delay windows with no active dispute.";
  }

  return {
    eligibleDate,
    isEligible,
    remainingHours,
    sellerDelayHours,
    inspectionHours,
    effectiveDelayHours,
    reason,
    disputeBlocked,
    handoverPending: false,
  };
}

/**
 * Backwards-compatible helper for calculating eligible payout date.
 */
export function calculateEligiblePayoutDate(
  orderDate: Date,
  vendor: {
    sellerType?: string | null;
    payoutDelayHours?: number | null;
  }
): { eligibleDate: Date; delayHours: number; reason: string } {
  const result = calculateEffectivePayoutEligibility(
    { delivered_at: orderDate },
    vendor
  );
  return {
    eligibleDate: result.eligibleDate,
    delayHours: result.effectiveDelayHours,
    reason: result.reason,
  };
}

/**
 * Check if order is eligible for payout release.
 */
export async function checkOrderPayoutStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      vendor: true,
      dispute: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const eligibility = calculateEffectivePayoutEligibility(order, order.vendor);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    escrowStatus: order.escrow_status,
    totalAmount: order.totalAmount,
    sellerType: order.vendor.sellerType,
    delayHours: eligibility.effectiveDelayHours,
    sellerDelayHours: eligibility.sellerDelayHours,
    inspectionHours: eligibility.inspectionHours,
    reason: eligibility.reason,
    eligibleDate: eligibility.eligibleDate,
    isEligible: eligibility.isEligible && (order.status === "CONFIRMED" || order.status === "DELIVERED"),
    remainingHours: eligibility.remainingHours,
    disputeBlocked: eligibility.disputeBlocked,
    handoverPending: eligibility.handoverPending,
  };
}

/**
 * Release escrow payout to vendor.
 */
export async function releaseEscrowPayout(orderId: string, adminUserId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { vendor: true, dispute: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const status = await checkOrderPayoutStatus(orderId);

  if (!status.isEligible && !adminUserId) {
    throw new Error(
      status.reason || `Escrow hold active. Payout eligible in approximately ${status.remainingHours} hours.`
    );
  }

  // Update order status to DELIVERED
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
        payoutDelayHours: status.delayHours,
        releasedBy: adminUserId ? `Admin:${adminUserId}` : "Automated Escrow Release",
      }),
    },
  }).catch(() => {});

  return updatedOrder;
}
