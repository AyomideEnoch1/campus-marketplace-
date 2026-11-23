/**
 * ==============================================================================
 * VALUE-BASED ESCROW RULES ENGINE & INTEGER KOBO FEE CALCULATOR
 * ==============================================================================
 * Enforces:
 * 1. Under ₦5,000: direct (no escrow)
 * 2. ₦5,000 to ₦19,999: optional (buyer toggle, default ON)
 * 3. ₦20,000 and above: mandatory escrow
 * 4. Forced Escrow Overrides (Guest seller, < Tier 4, strikes, <30 days, new buyer >=₦5k, restricted categories)
 * 5. Integer Kobo math for fees (0%, 1%, 2% with min/max caps)
 * 6. Settings snapshotting for order immutability
 * ==============================================================================
 */

import { prisma } from "@/lib/prisma";

export interface EscrowSettings {
  escrow_optional_min_kobo: number; // 500,000 kobo = ₦5,000
  escrow_mandatory_min_kobo: number; // 2,000,000 kobo = ₦20,000
  min_order_value_kobo: number; // 50,000 kobo = ₦500
  direct_order_max_total_kobo: number; // 1,999,900 kobo = ₦19,999
  direct_orders_per_day_buyer_limit: number; // 5
  direct_orders_per_day_seller_limit: number; // 10
  fee_band_1_percent: number; // 0.0% (Under ₦5,000)
  fee_band_2_percent: number; // 1.0% (₦5,000 to ₦19,999)
  fee_band_3_percent: number; // 2.0% (₦20,000 and above)
  fee_min_kobo: number; // 5,000 kobo = ₦50
  fee_max_kobo: number; // 500,000 kobo = ₦5,000
  fee_payer: "buyer" | "seller" | "split";
  direct_service_fee_kobo: number; // 0
  forced_rules: {
    guest_vendor: boolean;
    below_tier_4: boolean;
    active_strike_or_hold: boolean;
    joined_under_30_days: boolean;
    new_buyer_over_5k: boolean;
    restricted_category: boolean;
    restricted_categories: string[];
  };
}

export const DEFAULT_ESCROW_SETTINGS: EscrowSettings = {
  escrow_optional_min_kobo: 500000, // ₦5,000
  escrow_mandatory_min_kobo: 2000000, // ₦20,000
  min_order_value_kobo: 50000, // ₦500
  direct_order_max_total_kobo: 1999900, // ₦19,999
  direct_orders_per_day_buyer_limit: 5,
  direct_orders_per_day_seller_limit: 10,
  fee_band_1_percent: 0.0,
  fee_band_2_percent: 1.0,
  fee_band_3_percent: 2.0,
  fee_min_kobo: 5000, // ₦50
  fee_max_kobo: 500000, // ₦5,000
  fee_payer: "buyer",
  direct_service_fee_kobo: 0,
  forced_rules: {
    guest_vendor: true,
    below_tier_4: true,
    active_strike_or_hold: true,
    joined_under_30_days: true,
    new_buyer_over_5k: true,
    restricted_category: true,
    restricted_categories: [
      "electronics",
      "phones",
      "phones-tablets",
      "laptops",
      "laptops-computers",
      "audio-accessories",
      "food",
      "groceries",
      "food-groceries",
      "food-and-groceries",
      "beauty",
      "beauty-care",
      "health-and-beauty",
      "cosmetics",
      "fragrances",
    ],
  },
};

/**
 * Loads current platform settings from database with fallback.
 */
export async function getPlatformSettings(): Promise<EscrowSettings> {
  try {
    if (!prisma?.platformSetting) {
      return DEFAULT_ESCROW_SETTINGS;
    }
    const records = await prisma.platformSetting.findMany().catch(() => null);
    if (!records || records.length === 0) {
      return DEFAULT_ESCROW_SETTINGS;
    }

    const settings: EscrowSettings = { ...DEFAULT_ESCROW_SETTINGS };

    for (const r of records) {
      try {
        const parsed = JSON.parse(r.value);
        if (r.key === "escrow_thresholds") {
          Object.assign(settings, parsed);
        } else if (r.key === "escrow_fees") {
          Object.assign(settings, parsed);
        } else if (r.key === "forced_escrow_rules") {
          settings.forced_rules = { ...settings.forced_rules, ...parsed };
        }
      } catch {}
    }

    return settings;
  } catch (err) {
    console.warn("[Settings Warning] Using default escrow settings:", err);
    return DEFAULT_ESCROW_SETTINGS;
  }
}

export interface EvaluateEscrowInput {
  subtotal: number; // in Naira
  buyerWantsDirect?: boolean; // toggle state
  seller: {
    id: string;
    sellerType?: string;
    verificationTier?: number;
    isTrustedSeller?: boolean;
    strikesCount?: number;
    createdAt?: Date | string;
  };
  buyer?: {
    id?: string;
    email?: string;
    completedOrdersCount?: number;
  } | null;
  items: Array<{
    categoryId?: string;
    categorySlug?: string;
    categoryName?: string;
  }>;
  settings?: EscrowSettings;
  isSplittingSuspected?: boolean;
  splittingReason?: string | null;
}

export interface EvaluateEscrowOutput {
  escrow_mode: "escrow" | "direct";
  canToggle: boolean;
  isForced: boolean;
  forcedReason: string | null;
  thresholdCategory: "under_5k" | "5k_to_20k" | "20k_and_above";
  subtotalKobo: number;
  subtotalNaira: number;
  feePercent: number;
  feeAmountKobo: number;
  feeAmountNaira: number;
  feePayer: "buyer" | "seller" | "split";
  buyerTotalKobo: number;
  buyerTotalNaira: number;
  sellerAmountKobo: number;
  sellerAmountNaira: number;
  platformCommissionKobo: number;
  platformCommissionNaira: number;
  settingsSnapshot: EscrowSettings;
}

/**
 * Core evaluation engine: calculates mode, forced reasons, and integer kobo fees.
 */
export async function evaluateEscrowOrder(
  input: EvaluateEscrowInput
): Promise<EvaluateEscrowOutput> {
  const settings = input.settings || (await getPlatformSettings());
  const subtotalNaira = Number(input.subtotal);
  const subtotalKobo = Math.round(subtotalNaira * 100);

  // Validate minimum order value (default ₦500 = 50,000 kobo)
  if (subtotalKobo < settings.min_order_value_kobo) {
    throw new Error(
      `Order subtotal (₦${subtotalNaira.toLocaleString()}) is below the minimum order value of ₦${(
        settings.min_order_value_kobo / 100
      ).toLocaleString()}.`
    );
  }

  // 1. EVALUATE FORCED ESCROW OVERRIDES
  let isForced = false;
  let forcedReason: string | null = null;
  const seller = input.seller;
  const rules = settings.forced_rules;

  // Override 1: Seller is a guest vendor
  if (rules.guest_vendor && seller.sellerType === "guest") {
    isForced = true;
    forcedReason = "Escrow is mandatory for Non-Student Vendors.";
  }

  // Override 2: Seller is below Tier 4 (not yet a Trusted seller)
  if (
    !isForced &&
    rules.below_tier_4 &&
    ((seller.verificationTier || 1) < 4 || !seller.isTrustedSeller)
  ) {
    isForced = true;
    forcedReason = "Escrow is required for this vendor (Pending Tier 4 Trusted Seller Status).";
  }

  // Override 3: Seller has active strike or hold
  if (!isForced && rules.active_strike_or_hold && (seller.strikesCount || 0) > 0) {
    isForced = true;
    forcedReason = "Escrow is required due to vendor account safety restrictions.";
  }

  // Override 4: Seller joined less than 30 days ago
  if (!isForced && rules.joined_under_30_days && seller.createdAt) {
    const sellerCreatedMs = new Date(seller.createdAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - sellerCreatedMs < thirtyDaysMs) {
      isForced = true;
      forcedReason = "Escrow is required for new vendors registered within the last 30 days.";
    }
  }

  // Override 5: Buyer is new (no completed orders) and order is ₦5,000 or more
  if (
    !isForced &&
    rules.new_buyer_over_5k &&
    subtotalKobo >= settings.escrow_optional_min_kobo
  ) {
    const completedCount = input.buyer?.completedOrdersCount ?? 0;
    if (completedCount === 0) {
      isForced = true;
      forcedReason = "Escrow is required for first-time buyers on orders of ₦5,000 and above.";
    }
  }

  // Override 6: Order contains a restricted category (electronics, food, cosmetics)
  if (!isForced && rules.restricted_category) {
    const restrictedList = rules.restricted_categories.map((c) => c.toLowerCase());
    const hasRestricted = input.items.some((item) => {
      const slug = (item.categorySlug || "").toLowerCase();
      const name = (item.categoryName || "").toLowerCase();
      return restrictedList.some((r) => slug.includes(r) || name.includes(r));
    });

    if (hasRestricted) {
      isForced = true;
      forcedReason = "Escrow is mandatory for electronics, food, and cosmetic products.";
    }
  }

  // Override 7: Order-splitting or cumulative risk detected
  if (!isForced && input.isSplittingSuspected) {
    isForced = true;
    forcedReason = input.splittingReason || "Escrow protection applied based on recent transaction volume with this seller.";
  }

  // 2. VALUE BANDS & ESCROW MODE
  let escrow_mode: "escrow" | "direct" = "escrow";
  let canToggle = false;
  let thresholdCategory: "under_5k" | "5k_to_20k" | "20k_and_above" = "under_5k";

  if (subtotalKobo < settings.escrow_optional_min_kobo) {
    // Under ₦5,000
    thresholdCategory = "under_5k";
    if (isForced) {
      escrow_mode = "escrow";
      canToggle = false;
    } else {
      escrow_mode = "direct";
      canToggle = false;
    }
  } else if (subtotalKobo < settings.escrow_mandatory_min_kobo) {
    // ₦5,000 to ₦19,999: Optional band
    thresholdCategory = "5k_to_20k";
    if (isForced) {
      escrow_mode = "escrow";
      canToggle = false;
    } else {
      canToggle = true;
      // Default is ON (escrow), unless buyer explicitly opted out
      escrow_mode = input.buyerWantsDirect ? "direct" : "escrow";
    }
  } else {
    // ₦20,000 and above: Mandatory escrow
    thresholdCategory = "20k_and_above";
    escrow_mode = "escrow";
    canToggle = false;
    if (!isForced) {
      forcedReason = "Escrow protection is mandatory for orders of ₦20,000 and above.";
    }
  }

  // 3. INTEGER KOBO FEE MATH
  let feePercent = 0.0;
  let feeAmountKobo = 0;

  if (escrow_mode === "escrow") {
    if (thresholdCategory === "under_5k") {
      feePercent = settings.fee_band_1_percent; // 0%
    } else if (thresholdCategory === "5k_to_20k") {
      feePercent = settings.fee_band_2_percent; // 1%
    } else {
      feePercent = settings.fee_band_3_percent; // 2%
    }

    if (feePercent > 0) {
      const rawFeeKobo = Math.round((subtotalKobo * feePercent) / 100);
      feeAmountKobo = Math.max(settings.fee_min_kobo, Math.min(settings.fee_max_kobo, rawFeeKobo));
    }
  } else {
    // Direct orders carry 0% escrow fee, optional small service fee
    feePercent = 0.0;
    feeAmountKobo = settings.direct_service_fee_kobo || 0;
  }

  const feeAmountNaira = feeAmountKobo / 100;
  const feePayer = settings.fee_payer;

  // Platform Commission (standard 5% across all marketplace sales, deducted from seller proceeds)
  const commissionRate = 0.05;
  const platformCommissionKobo = Math.round(subtotalKobo * commissionRate);
  const platformCommissionNaira = platformCommissionKobo / 100;

  // Totals based on fee payer
  let buyerTotalKobo = subtotalKobo;
  let sellerAmountKobo = subtotalKobo - platformCommissionKobo;

  if (feePayer === "buyer") {
    buyerTotalKobo += feeAmountKobo;
  } else if (feePayer === "seller") {
    sellerAmountKobo = Math.max(0, sellerAmountKobo - feeAmountKobo);
  } else if (feePayer === "split") {
    const halfFee = Math.round(feeAmountKobo / 2);
    buyerTotalKobo += halfFee;
    sellerAmountKobo = Math.max(0, sellerAmountKobo - (feeAmountKobo - halfFee));
  }

  return {
    escrow_mode,
    canToggle,
    isForced,
    forcedReason,
    thresholdCategory,
    subtotalKobo,
    subtotalNaira,
    feePercent,
    feeAmountKobo,
    feeAmountNaira,
    feePayer,
    buyerTotalKobo,
    buyerTotalNaira: buyerTotalKobo / 100,
    sellerAmountKobo,
    sellerAmountNaira: sellerAmountKobo / 100,
    platformCommissionKobo,
    platformCommissionNaira,
    settingsSnapshot: settings,
  };
}

export interface OrderSplittingRiskResult {
  isSplittingSuspected: boolean;
  reason: string | null;
  cumulativeSubtotalKobo: number;
  recentOrderCount: number;
}

/**
 * Sensible risk-based detection for suspicious related transactions (order splitting).
 * Evaluates whether multiple sub-threshold purchases between the same buyer and seller
 * aggregate to exceed optional (₦5,000) or mandatory (₦20,000) escrow levels within 24 hours,
 * or occur in rapid succession, without blocking legitimate repeat transactions.
 */
export async function checkOrderSplittingRisk(
  buyerId: string | null | undefined,
  vendorId: string,
  currentSubtotalKobo: number
): Promise<OrderSplittingRiskResult> {
  if (!buyerId) {
    return {
      isSplittingSuspected: false,
      reason: null,
      cumulativeSubtotalKobo: currentSubtotalKobo,
      recentOrderCount: 0,
    };
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Fetch recent direct orders between this buyer and vendor in the last 24h
    const recentOrders = await prisma.order.findMany({
      where: {
        buyerId,
        vendorId,
        createdAt: { gte: twentyFourHoursAgo },
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        subtotal: true,
        escrow_mode: true,
        createdAt: true,
      },
    });

    const recentDirectOrders = recentOrders.filter((o) => o.escrow_mode === "direct");
    const pastDirectKobo = recentDirectOrders.reduce(
      (sum, o) => sum + Math.round(Number(o.subtotal || 0) * 100),
      0
    );
    const totalCombinedKobo = pastDirectKobo + currentSubtotalKobo;

    // 1. Cumulative crossing into mandatory escrow threshold (>= ₦20,000)
    if (pastDirectKobo > 0 && totalCombinedKobo >= 2000000) {
      return {
        isSplittingSuspected: true,
        reason: `Combined direct purchases with this seller in the last 24 hours reach ₦${(totalCombinedKobo / 100).toLocaleString()}. Escrow protection is mandatory for transaction safety.`,
        cumulativeSubtotalKobo: totalCombinedKobo,
        recentOrderCount: recentOrders.length,
      };
    }

    // 2. Cumulative crossing into optional escrow threshold (>= ₦5,000)
    if (pastDirectKobo > 0 && totalCombinedKobo >= 500000) {
      return {
        isSplittingSuspected: true,
        reason: `Combined direct purchases with this seller in the last 24 hours reach ₦${(totalCombinedKobo / 100).toLocaleString()}. Escrow protection applied.`,
        cumulativeSubtotalKobo: totalCombinedKobo,
        recentOrderCount: recentOrders.length,
      };
    }

    // 3. Rapid succession burst (2 or more direct orders in the last 10 minutes)
    const rapidOrders = recentDirectOrders.filter((o) => new Date(o.createdAt) >= tenMinutesAgo);
    if (rapidOrders.length >= 2) {
      return {
        isSplittingSuspected: true,
        reason: "Multiple rapid transactions detected between the same buyer and seller. Escrow protection applied for transaction safety.",
        cumulativeSubtotalKobo: totalCombinedKobo,
        recentOrderCount: recentOrders.length,
      };
    }

    return {
      isSplittingSuspected: false,
      reason: null,
      cumulativeSubtotalKobo: totalCombinedKobo,
      recentOrderCount: recentOrders.length,
    };
  } catch (err) {
    console.warn("[Risk Check Warning] Could not evaluate order splitting history:", err);
    return {
      isSplittingSuspected: false,
      reason: null,
      cumulativeSubtotalKobo: currentSubtotalKobo,
      recentOrderCount: 0,
    };
  }
}
