import { prisma } from "@/lib/prisma";
import { VendorAccessState, VendorStatus } from "@prisma/client";

export const DEFAULT_VENDOR_MAX_LISTINGS = 50;
export const STANDARD_COMMISSION_PERCENT = 2.0;
export const ACTIVE_COMMISSION_PERCENT = 0.0;

export interface VendorEntitlements {
  hasAccess: boolean;
  accessState: VendorAccessState;
  isApproved: boolean;
  approvalStatus: VendorStatus;
  canPublish: boolean;
  canUploadProducts: boolean;
  canAccessDashboard: boolean;
  isReadOnly: boolean;
  commissionPercent: number;
  maxListings: number;
  daysRemaining: number | null;
  daysUntilExpiry?: number | null;
  isExpiringSoon?: boolean;
  accessExpiresAt: Date | null;
  needsActivation: boolean;
  planType: "paid" | "coupon" | "none";
  paymentRestrictionEnabled: boolean;
}

export interface ComputeEntitlementsOptions {
  paymentRestrictionEnabled?: boolean;
  standardVendorAccessEnabled?: boolean;
  foundingVendorCouponEnabled?: boolean;
}

/**
 * Check if the admin has enabled vendor payment restriction (paywall).
 * Defaults to true if not explicitly set to "false".
 */
export async function isVendorPaymentRestrictionEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "require_vendor_payment" },
    });
    return setting?.value !== "false";
  } catch {
    return true;
  }
}

/**
 * Check if Standard Vendor Access (Paid Access) is enabled.
 * Defaults to true if not explicitly set to "false".
 */
export async function isStandardVendorAccessEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "enable_standard_vendor_access" },
    });
    return setting?.value !== "false";
  } catch {
    return true;
  }
}

/**
 * Check if Founding Vendor Coupon redemption is enabled.
 * Defaults to true if not explicitly set to "false".
 */
export async function isFoundingVendorCouponEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "enable_founding_vendor_coupon" },
    });
    return setting?.value !== "false";
  } catch {
    return true;
  }
}

/**
 * Single source of truth for vendor entitlements (identical for paid & coupon access).
 * When paymentRestrictionEnabled is false or both access options are disabled, vendors do not need to pay or redeem coupons to publish.
 */
export function computeVendorEntitlements(
  vendor: {
    accessState: VendorAccessState;
    status: VendorStatus;
    accessExpiresAt?: Date | null;
  },
  options?: ComputeEntitlementsOptions
): VendorEntitlements {
  const isPaymentRestrictionEnabled = options?.paymentRestrictionEnabled !== false;
  const isStandardAccessEnabled = options?.standardVendorAccessEnabled !== false;
  const isCouponEnabled = options?.foundingVendorCouponEnabled !== false;

  // When payment restriction is bypassed (false) OR when both standard access and coupon are disabled by admin,
  // any vendor has active access without needing to pay or redeem coupons.
  const isBypassed = !isPaymentRestrictionEnabled || (!isStandardAccessEnabled && !isCouponEnabled);

  const now = new Date();
  const rawState = vendor.accessState || "UNPAID";
  const status = vendor.status || "PENDING";
  const accessExpiresAt = vendor.accessExpiresAt ? new Date(vendor.accessExpiresAt) : null;

  // Check if active access has passed its expiration date
  const isTimeExpired = Boolean(accessExpiresAt && accessExpiresAt.getTime() <= now.getTime());

  let effectiveAccessState: VendorAccessState = rawState;
  if ((rawState === "ACTIVE_PAID" || rawState === "ACTIVE_COUPON") && isTimeExpired) {
    effectiveAccessState = "EXPIRED";
  }

  // When bypassed, any vendor has active access without paying
  const hasAccess =
    isBypassed ||
    effectiveAccessState === "ACTIVE_PAID" ||
    effectiveAccessState === "ACTIVE_COUPON";
  const isApproved = status === "APPROVED";

  // Gate 5: Vendor can publish products to the public shop ONLY when access is active (or bypassed) AND admin has approved.
  const canPublish = hasAccess && isApproved;
  // Users cannot upload products until approved by the admin
  const canUploadProducts = isApproved;

  // Paid and coupon entitlements are identical:
  // - 0% commission while active or bypassed
  // - Reverts to standard commission (2.0%) when expired or unpaid with active restriction
  const commissionPercent = hasAccess ? ACTIVE_COMMISSION_PERCENT : STANDARD_COMMISSION_PERCENT;

  // Days remaining calculation
  let daysRemaining: number | null = null;
  if (accessExpiresAt) {
    const diffMs = accessExpiresAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Dashboard access:
  // When payment restriction is disabled/bypassed, no paywall or activation prompt is shown
  const isReadOnly = !isBypassed && !hasAccess;
  const needsActivation = !isBypassed && !hasAccess;

  const planType: "paid" | "coupon" | "none" =
    effectiveAccessState === "ACTIVE_PAID"
      ? "paid"
      : effectiveAccessState === "ACTIVE_COUPON"
      ? "coupon"
      : "none";

  return {
    hasAccess,
    accessState: effectiveAccessState,
    isApproved,
    approvalStatus: status,
    canPublish,
    canUploadProducts,
    canAccessDashboard: true,
    isReadOnly,
    commissionPercent,
    maxListings: DEFAULT_VENDOR_MAX_LISTINGS,
    daysRemaining,
    daysUntilExpiry: daysRemaining,
    isExpiringSoon: Boolean(hasAccess && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0),
    accessExpiresAt,
    needsActivation,
    planType,
    paymentRestrictionEnabled: isPaymentRestrictionEnabled,
  };
}

/**
 * Fetch and compute entitlements by vendorId or userId
 */
export async function getVendorEntitlements(
  vendorIdOrUserId: string
): Promise<VendorEntitlements | null> {
  const [vendor, settings] = await Promise.all([
    prisma.vendorProfile.findFirst({
      where: {
        OR: [{ id: vendorIdOrUserId }, { userId: vendorIdOrUserId }],
      },
      select: {
        id: true,
        accessState: true,
        status: true,
        accessExpiresAt: true,
      },
    }),
    prisma.siteSetting.findMany({
      where: {
        key: {
          in: ["require_vendor_payment", "enable_standard_vendor_access", "enable_founding_vendor_coupon"],
        },
      },
    }),
  ]);

  if (!vendor) return null;

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const paymentRestrictionEnabled = settingsMap["require_vendor_payment"] !== "false";
  const standardVendorAccessEnabled = settingsMap["enable_standard_vendor_access"] !== "false";
  const foundingVendorCouponEnabled = settingsMap["enable_founding_vendor_coupon"] !== "false";

  return computeVendorEntitlements(vendor, {
    paymentRestrictionEnabled,
    standardVendorAccessEnabled,
    foundingVendorCouponEnabled,
  });
}
