export type PromoDiscountType = "PERCENTAGE" | "FIXED";
export type PromoStatus = "SCHEDULED" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface PromoCalculationResult {
  promoPrice: number;
  discountPercent: number;
  savingsAmount: number;
}

/**
 * Pure calculation function for promotional pricing
 */
export function calculatePromoPrice(
  basePrice: number,
  discountType: PromoDiscountType,
  discountValue: number
): PromoCalculationResult {
  const price = Math.max(0, Number(basePrice) || 0);
  const val = Math.max(0, Number(discountValue) || 0);

  if (price === 0 || val === 0) {
    return {
      promoPrice: price,
      discountPercent: 0,
      savingsAmount: 0,
    };
  }

  let promoPrice = price;
  let discountPercent = 0;

  if (discountType === "PERCENTAGE") {
    const cappedPercent = Math.min(100, val);
    discountPercent = Math.round(cappedPercent);
    promoPrice = Math.max(0, Math.round(price * (1 - cappedPercent / 100)));
  } else {
    // FIXED amount
    const cappedDiscount = Math.min(price, val);
    promoPrice = Math.max(0, Math.round(price - cappedDiscount));
    discountPercent = price > 0 ? Math.round(((price - promoPrice) / price) * 100) : 0;
  }

  const savingsAmount = Math.max(0, price - promoPrice);

  return {
    promoPrice,
    discountPercent,
    savingsAmount,
  };
}

/**
 * Determine promo status based on timestamps and current state
 */
export function getPromoLiveStatus(
  promo: {
    startAt: Date | string;
    endAt: Date | string;
    status: string;
  },
  now: Date = new Date()
): PromoStatus {
  if (promo.status === "CANCELLED") return "CANCELLED";

  const start = new Date(promo.startAt).getTime();
  const end = new Date(promo.endAt).getTime();
  const current = now.getTime();

  if (current < start) {
    return "SCHEDULED";
  }
  if (current >= start && current < end) {
    return "ACTIVE";
  }
  return "EXPIRED";
}

export interface ActivePromoInfo {
  id: string;
  label: string | null;
  discountType: PromoDiscountType;
  discountValue: number;
  promoPrice: number;
  discountPercent: number;
  savingsAmount: number;
  startAt: string; // ISO string in UTC
  endAt: string;   // ISO string in UTC
  serverNow: string; // ISO string in UTC
  secondsRemaining: number;
  isEndingSoon: boolean; // < 1 hour (3600 seconds)
}

export interface EffectivePriceResult {
  effectivePrice: number;
  originalPrice: number;
  comparePrice: number | null;
  hasActivePromo: boolean;
  activePromo: ActivePromoInfo | null;
}

/**
 * Calculates effective price for a product, taking into account any active promotion.
 */
export function getEffectiveProductPrice(
  product: {
    price: number;
    comparePrice?: number | null;
    promotions?: Array<{
      id: string;
      label?: string | null;
      discountType: string;
      discountValue: number;
      promoPrice?: number;
      startAt: Date | string;
      endAt: Date | string;
      status: string;
    }>;
  },
  serverNow: Date = new Date()
): EffectivePriceResult {
  const originalPrice = Number(product.price) || 0;
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;

  if (!product.promotions || product.promotions.length === 0) {
    return {
      effectivePrice: originalPrice,
      originalPrice,
      comparePrice,
      hasActivePromo: false,
      activePromo: null,
    };
  }

  const nowMs = serverNow.getTime();
  const activePromoObj = product.promotions.find((p) => {
    if (p.status === "CANCELLED") return false;
    const startMs = new Date(p.startAt).getTime();
    const endMs = new Date(p.endAt).getTime();
    return nowMs >= startMs && nowMs < endMs;
  });

  if (!activePromoObj) {
    return {
      effectivePrice: originalPrice,
      originalPrice,
      comparePrice,
      hasActivePromo: false,
      activePromo: null,
    };
  }

  const calc = calculatePromoPrice(
    originalPrice,
    activePromoObj.discountType as PromoDiscountType,
    activePromoObj.discountValue
  );

  const endMs = new Date(activePromoObj.endAt).getTime();
  const secondsRemaining = Math.max(0, Math.floor((endMs - nowMs) / 1000));
  const isEndingSoon = secondsRemaining > 0 && secondsRemaining <= 3600;

  return {
    effectivePrice: calc.promoPrice,
    originalPrice,
    comparePrice: comparePrice || originalPrice,
    hasActivePromo: true,
    activePromo: {
      id: activePromoObj.id,
      label: activePromoObj.label || null,
      discountType: activePromoObj.discountType as PromoDiscountType,
      discountValue: activePromoObj.discountValue,
      promoPrice: calc.promoPrice,
      discountPercent: calc.discountPercent,
      savingsAmount: calc.savingsAmount,
      startAt: new Date(activePromoObj.startAt).toISOString(),
      endAt: new Date(activePromoObj.endAt).toISOString(),
      serverNow: serverNow.toISOString(),
      secondsRemaining,
      isEndingSoon,
    },
  };
}
