import assert from "node:assert/strict";

/**
 * Pure calculation function for promotional pricing
 */
function calculatePromoPrice(basePrice, discountType, discountValue) {
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
function getPromoLiveStatus(promo, now = new Date()) {
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

/**
 * Calculates effective price for a product, taking into account any active promotion.
 */
function getEffectiveProductPrice(product, serverNow = new Date()) {
  const originalPrice = Math.max(0, Number(product.price) || 0);
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

  const activePromoRecord = product.promotions.find((promo) => {
    const liveStatus = getPromoLiveStatus(promo, serverNow);
    return liveStatus === "ACTIVE";
  });

  if (!activePromoRecord) {
    return {
      effectivePrice: originalPrice,
      originalPrice,
      comparePrice,
      hasActivePromo: false,
      activePromo: null,
    };
  }

  const { promoPrice, discountPercent, savingsAmount } = calculatePromoPrice(
    originalPrice,
    activePromoRecord.discountType,
    activePromoRecord.discountValue
  );

  const endMs = new Date(activePromoRecord.endAt).getTime();
  const nowMs = serverNow.getTime();
  const secondsRemaining = Math.max(0, Math.floor((endMs - nowMs) / 1000));
  const isEndingSoon = secondsRemaining <= 3600;

  const activePromoInfo = {
    id: activePromoRecord.id,
    label: activePromoRecord.label || null,
    discountType: activePromoRecord.discountType,
    discountValue: activePromoRecord.discountValue,
    promoPrice,
    discountPercent,
    savingsAmount,
    startAt: new Date(activePromoRecord.startAt).toISOString(),
    endAt: new Date(activePromoRecord.endAt).toISOString(),
    serverNow: serverNow.toISOString(),
    secondsRemaining,
    isEndingSoon,
  };

  return {
    effectivePrice: promoPrice,
    originalPrice,
    comparePrice,
    hasActivePromo: true,
    activePromo: activePromoInfo,
  };
}

console.log("=========================================");
console.log("Running Timed Promotions Test Suite...");
console.log("=========================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

// 1. Pricing Math Tests
test("PERCENTAGE: 20% discount on ₦10,000 should equal ₦8,000 with ₦2,000 savings", () => {
  const result = calculatePromoPrice(10000, "PERCENTAGE", 20);
  assert.equal(result.promoPrice, 8000);
  assert.equal(result.discountPercent, 20);
  assert.equal(result.savingsAmount, 2000);
});

test("PERCENTAGE: 15% discount on ₦3,500 should round properly", () => {
  const result = calculatePromoPrice(3500, "PERCENTAGE", 15);
  assert.equal(result.promoPrice, 2975);
  assert.equal(result.discountPercent, 15);
  assert.equal(result.savingsAmount, 525);
});

test("FIXED: ₦1,500 discount on ₦5,000 should equal ₦3,500 with 30% discount", () => {
  const result = calculatePromoPrice(5000, "FIXED", 1500);
  assert.equal(result.promoPrice, 3500);
  assert.equal(result.discountPercent, 30);
  assert.equal(result.savingsAmount, 1500);
});

test("BOUNDARY: Fixed discount higher than price should clamp to ₦0", () => {
  const result = calculatePromoPrice(2000, "FIXED", 5000);
  assert.equal(result.promoPrice, 0);
  assert.equal(result.discountPercent, 100);
  assert.equal(result.savingsAmount, 2000);
});

test("BOUNDARY: Percentage discount over 100% should clamp to 100%", () => {
  const result = calculatePromoPrice(5000, "PERCENTAGE", 150);
  assert.equal(result.promoPrice, 0);
  assert.equal(result.discountPercent, 100);
  assert.equal(result.savingsAmount, 5000);
});

test("ZERO-DISCOUNT: 0% discount returns full original price", () => {
  const result = calculatePromoPrice(7500, "PERCENTAGE", 0);
  assert.equal(result.promoPrice, 7500);
  assert.equal(result.discountPercent, 0);
  assert.equal(result.savingsAmount, 0);
});

// 2. Status & Expiry Tests
test("STATUS: Future start time returns SCHEDULED", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  const promo = {
    startAt: new Date("2026-11-24T00:00:00Z"),
    endAt: new Date("2026-11-26T00:00:00Z"),
    status: "SCHEDULED",
  };
  const status = getPromoLiveStatus(promo, now);
  assert.equal(status, "SCHEDULED");
});

test("STATUS: Current time between start and end returns ACTIVE", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  const promo = {
    startAt: new Date("2026-11-23T08:00:00Z"),
    endAt: new Date("2026-11-25T08:00:00Z"),
    status: "ACTIVE",
  };
  const status = getPromoLiveStatus(promo, now);
  assert.equal(status, "ACTIVE");
});

test("STATUS: Current time past end time returns EXPIRED", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  const promo = {
    startAt: new Date("2026-11-20T08:00:00Z"),
    endAt: new Date("2026-11-22T08:00:00Z"),
    status: "ACTIVE",
  };
  const status = getPromoLiveStatus(promo, now);
  assert.equal(status, "EXPIRED");
});

test("STATUS: Cancelled promo stays CANCELLED regardless of timestamps", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  const promo = {
    startAt: new Date("2026-11-23T08:00:00Z"),
    endAt: new Date("2026-11-25T08:00:00Z"),
    status: "CANCELLED",
  };
  const status = getPromoLiveStatus(promo, now);
  assert.equal(status, "CANCELLED");
});

// 3. Effective Product Pricing Engine Tests
test("ENGINE: Product with no promotions returns base price", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  const product = {
    price: 12000,
    comparePrice: 15000,
    promotions: [],
  };
  const res = getEffectiveProductPrice(product, now);
  assert.equal(res.effectivePrice, 12000);
  assert.equal(res.hasActivePromo, false);
  assert.equal(res.activePromo, null);
});

test("ENGINE: Product with active promotion returns promo price & timing metadata", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  const product = {
    price: 10000,
    promotions: [
      {
        id: "promo-1",
        label: "Black Friday Deal",
        discountType: "PERCENTAGE",
        discountValue: 25,
        startAt: new Date("2026-11-23T00:00:00Z"),
        endAt: new Date("2026-11-23T12:30:00Z"), // 30 minutes left
        status: "ACTIVE",
      },
    ],
  };
  const res = getEffectiveProductPrice(product, now);
  assert.equal(res.hasActivePromo, true);
  assert.equal(res.effectivePrice, 7500);
  assert.equal(res.originalPrice, 10000);
  assert.equal(res.activePromo?.label, "Black Friday Deal");
  assert.equal(res.activePromo?.secondsRemaining, 1800); // 30m = 1800s
  assert.equal(res.activePromo?.isEndingSoon, true); // < 1 hour
});

test("ENGINE: Product with scheduled promo does not apply discount yet", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  const product = {
    price: 10000,
    promotions: [
      {
        id: "promo-future",
        label: "Cyber Monday",
        discountType: "PERCENTAGE",
        discountValue: 40,
        startAt: new Date("2026-11-24T00:00:00Z"),
        endAt: new Date("2026-11-25T00:00:00Z"),
        status: "SCHEDULED",
      },
    ],
  };
  const res = getEffectiveProductPrice(product, now);
  assert.equal(res.hasActivePromo, false);
  assert.equal(res.effectivePrice, 10000);
});

test("EDGE CASE: Vendor changed base price while promo is active", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  const product = {
    price: 20000, // Updated base price
    promotions: [
      {
        id: "promo-live",
        discountType: "PERCENTAGE",
        discountValue: 20,
        promoPrice: 8000, // Old stored promo price
        startAt: new Date("2026-11-23T00:00:00Z"),
        endAt: new Date("2026-11-24T00:00:00Z"),
        status: "ACTIVE",
      },
    ],
  };
  const res = getEffectiveProductPrice(product, now);
  assert.equal(res.effectivePrice, 16000); // 20000 * 0.8
  assert.equal(res.activePromo?.promoPrice, 16000);
  assert.equal(res.activePromo?.savingsAmount, 4000);
});

test("EDGE CASE: Promo expires between add-to-cart and checkout", () => {
  const now = new Date("2026-11-23T18:00:00Z");
  const product = {
    price: 10000,
    promotions: [
      {
        id: "promo-expired",
        discountType: "PERCENTAGE",
        discountValue: 40,
        promoPrice: 6000,
        startAt: new Date("2026-11-23T00:00:00Z"),
        endAt: new Date("2026-11-23T12:00:00Z"), // Ended 6 hours ago
        status: "ACTIVE",
      },
    ],
  };
  const res = getEffectiveProductPrice(product, now);
  assert.equal(res.hasActivePromo, false);
  assert.equal(res.effectivePrice, 10000); // Back to ₦10,000
});

console.log("\n=========================================");
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
}
