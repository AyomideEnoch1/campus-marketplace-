import { prisma } from "@/lib/prisma";
import { CouponRedemptionStatus, CouponReleaseReason, VendorAccessState } from "@prisma/client";

// In-memory rate limiting map for coupon attempts: key -> [timestamps]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 5;

/**
 * Check and record rate limit attempts for coupon code redemption
 */
export function checkCouponRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(identifier) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_ATTEMPTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  timestamps.push(now);
  rateLimitMap.set(identifier, timestamps);
  return true;
}

/**
 * Normalize coupon codes (trimmed, uppercase, single spacing)
 */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Calculate active redemptions count for a coupon
 */
export async function getActiveRedemptionsCount(couponId: string, tx?: any): Promise<number> {
  const client = tx || prisma;
  return client.couponRedemption.count({
    where: {
      couponId,
      status: "ACTIVE",
    },
  });
}

export interface RedeemCouponResult {
  success: boolean;
  error?: string;
  redemption?: any;
  accessExpiresAt?: Date;
}

/**
 * Atomically redeem a coupon for a vendor.
 * Guarantees race-condition safety on the cap even when multiple requests arrive simultaneously.
 */
export async function redeemCouponAtomic({
  vendorId,
  code,
  clientIp,
}: {
  vendorId: string;
  code: string;
  clientIp?: string;
}): Promise<RedeemCouponResult> {
  // 1. Rate limiting check
  const rateLimitKey = `${clientIp || "ip"}:${vendorId}`;
  if (!checkCouponRateLimit(rateLimitKey)) {
    return {
      success: false,
      error: "Too many redemption attempts. Please wait a minute before trying again.",
    };
  }

  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) {
    return {
      success: false,
      error: "Please enter a valid coupon code.",
    };
  }

  // Generic failure message that doesn't leak which codes exist
  const GENERIC_ERROR = "Invalid coupon code, or this coupon is currently unavailable.";

  try {
    return await prisma.$transaction(async (tx) => {
      // 2. Fetch vendor profile
      const vendor = await tx.vendorProfile.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          accessState: true,
          status: true,
        },
      });

      if (!vendor) {
        return { success: false, error: "Vendor profile not found." };
      }

      // Check: vendor already has active paid or coupon access
      if (vendor.accessState === "ACTIVE_PAID") {
        return {
          success: false,
          error: "You already have active paid vendor access.",
        };
      }
      if (vendor.accessState === "ACTIVE_COUPON") {
        return {
          success: false,
          error: "You already have an active coupon applied to your account.",
        };
      }

      // Check: A vendor cannot re-redeem after a slot was released for inactivity, rejection, or expiry
      const previousRedemption = await tx.couponRedemption.findFirst({
        where: {
          vendorId,
          status: { in: ["EXPIRED", "RELEASED", "REVOKED"] },
        },
      });

      if (previousRedemption) {
        return {
          success: false,
          error: "Your previous coupon slot has lapsed or was released. Access must now be activated via payment.",
        };
      }

      // 3. Find coupon
      // In PostgreSQL, row-lock the coupon row to serialize concurrent claims on the final slot
      const coupons = await tx.$queryRaw<any[]>`
        SELECT * FROM "Coupon" 
        WHERE "code" = ${normalizedCode}
        LIMIT 1
        FOR UPDATE
      `;

      const coupon = coupons?.[0];
      if (!coupon) {
        return { success: false, error: GENERIC_ERROR };
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        return { success: false, error: GENERIC_ERROR };
      }

      // Check if coupon expiration date has passed (stops new redemptions)
      if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) {
        return { success: false, error: GENERIC_ERROR };
      }

      // 4. Check active redemptions cap
      // The cap counts ONLY redemptions with status 'ACTIVE'
      const activeCount = await tx.couponRedemption.count({
        where: {
          couponId: coupon.id,
          status: "ACTIVE",
        },
      });

      if (activeCount >= coupon.maxRedemptions) {
        return {
          success: false,
          error: "This founding coupon has reached its maximum redemptions cap.",
        };
      }

      // Check if this vendor already has any redemption recorded for this coupon
      const existingVendorRedemption = await tx.couponRedemption.findUnique({
        where: {
          couponId_vendorId: {
            couponId: coupon.id,
            vendorId,
          },
        },
      });

      if (existingVendorRedemption) {
        return {
          success: false,
          error: "You have already claimed this coupon.",
        };
      }

      // 5. Create redemption record
      const now = new Date();
      const freePeriodDays = coupon.freePeriodDays || 180;
      const accessExpiresAt = new Date(now.getTime() + freePeriodDays * 24 * 60 * 60 * 1000);

      const redemption = await tx.couponRedemption.create({
        data: {
          couponId: coupon.id,
          vendorId,
          status: "ACTIVE",
          redeemedAt: now,
          accessExpiresAt,
        },
      });

      // 6. Update vendor profile accessState
      await tx.vendorProfile.update({
        where: { id: vendorId },
        data: {
          accessState: "ACTIVE_COUPON",
          accessActivatedAt: now,
          accessExpiresAt,
        },
      });

      return {
        success: true,
        redemption,
        accessExpiresAt,
      };
    });
  } catch (err: any) {
    console.error("[Redeem Coupon Error]:", err);
    return {
      success: false,
      error: err.message?.includes("Unique constraint")
        ? "You have already claimed this coupon."
        : "Unable to apply coupon. Please try again.",
    };
  }
}

/**
 * Release a vendor's coupon slot (e.g. on admin rejection, inactivity, or paid upgrade)
 */
export async function releaseCouponSlot(
  vendorId: string,
  reason: CouponReleaseReason,
  options?: { targetAccessState?: VendorAccessState; tx?: any }
) {
  const client = options?.tx || prisma;
  const now = new Date();

  // Find any active redemption for this vendor
  const activeRedemption = await client.couponRedemption.findFirst({
    where: {
      vendorId,
      status: "ACTIVE",
    },
  });

  if (activeRedemption) {
    await client.couponRedemption.update({
      where: { id: activeRedemption.id },
      data: {
        status: "RELEASED",
        releasedAt: now,
        releaseReason: reason,
      },
    });
  }

  // Set vendor access state
  const targetState = options?.targetAccessState || (reason === "PAID_UPGRADE" ? "ACTIVE_PAID" : "RELEASED");

  await client.vendorProfile.update({
    where: { id: vendorId },
    data: {
      accessState: targetState,
      ...(reason !== "PAID_UPGRADE" ? { accessExpiresAt: null } : {}),
    },
  });

  return { success: true, released: Boolean(activeRedemption) };
}

/**
 * Upgrade a vendor from coupon or unpaid to active paid access
 */
export async function activatePaidVendorAccess({
  vendorId,
  durationDays = 365,
}: {
  vendorId: string;
  durationDays?: number;
}) {
  const now = new Date();
  const accessExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    // 1. If vendor was currently on an active coupon, release their coupon slot
    await releaseCouponSlot(vendorId, "PAID_UPGRADE", {
      targetAccessState: "ACTIVE_PAID",
      tx,
    });

    // 2. Set vendor to ACTIVE_PAID with updated expiration
    const updated = await tx.vendorProfile.update({
      where: { id: vendorId },
      data: {
        accessState: "ACTIVE_PAID",
        accessPaidAt: now,
        accessActivatedAt: now,
        accessExpiresAt,
      },
    });

    // 3. Unhide any products that were previously hidden due to expiry
    await tx.product.updateMany({
      where: {
        vendorId,
        status: "HIDDEN",
      },
      data: {
        status: "PUBLISHED",
      },
    });

    return { success: true, vendor: updated, accessExpiresAt };
  });
}
