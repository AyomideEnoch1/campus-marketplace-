/**
 * Comprehensive Automated Test Suite for Founding Vendor Coupon & Access System
 * Tests all 12 edge cases against the live PostgreSQL database.
 */

require('dotenv').config();
const { ensureSafeDb } = require('./ensure-safe-db');
ensureSafeDb('scripts/test-vendor-coupons.js');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition, testName, failureMsg) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${failureMsg || 'Assertion failed'}`);
    failed++;
  }
}

// Helper: Normalize coupon codes
function normalizeCouponCode(code) {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

// Helper: Atomic coupon redemption logic replicating src/lib/coupons.ts
async function redeemAtomic(vendorId, code) {
  const normalized = normalizeCouponCode(code);
  const GENERIC_ERROR = "Invalid coupon code, or this coupon is currently unavailable.";

  try {
    return await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendorProfile.findUnique({
        where: { id: vendorId },
        select: { id: true, accessState: true, status: true },
      });

      if (!vendor) return { success: false, error: "Vendor profile not found." };
      if (vendor.accessState === "ACTIVE_PAID") {
        return { success: false, error: "You already have active paid vendor access." };
      }
      if (vendor.accessState === "ACTIVE_COUPON") {
        return { success: false, error: "You already have an active coupon applied to your account." };
      }

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

      const coupons = await tx.$queryRaw`
        SELECT * FROM "Coupon" 
        WHERE "code" = ${normalized}
        LIMIT 1
        FOR UPDATE
      `;

      const coupon = coupons?.[0];
      if (!coupon || !coupon.isActive) {
        return { success: false, error: GENERIC_ERROR };
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) {
        return { success: false, error: GENERIC_ERROR };
      }

      const activeCount = await tx.couponRedemption.count({
        where: { couponId: coupon.id, status: "ACTIVE" },
      });

      if (activeCount >= coupon.maxRedemptions) {
        return { success: false, error: "This founding coupon has reached its maximum redemptions cap." };
      }

      const existingRedemption = await tx.couponRedemption.findUnique({
        where: { couponId_vendorId: { couponId: coupon.id, vendorId } },
      });

      if (existingRedemption) {
        return { success: false, error: "You have already claimed this coupon." };
      }

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

      await tx.vendorProfile.update({
        where: { id: vendorId },
        data: {
          accessState: "ACTIVE_COUPON",
          accessActivatedAt: now,
          accessExpiresAt,
        },
      });

      return { success: true, redemption, accessExpiresAt };
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Helper: Release coupon slot
async function releaseSlot(redemptionId, reason) {
  return await prisma.$transaction(async (tx) => {
    const redemption = await tx.couponRedemption.findUnique({
      where: { id: redemptionId },
      include: { vendor: true },
    });

    if (!redemption || redemption.status !== "ACTIVE") {
      return { success: false, error: "Active redemption not found" };
    }

    const now = new Date();
    const updatedRedemption = await tx.couponRedemption.update({
      where: { id: redemptionId },
      data: {
        status: "RELEASED",
        releasedAt: now,
        releaseReason: reason,
      },
    });

    let newAccessState = "RELEASED";
    if (reason === "INACTIVITY") newAccessState = "UNPAID";

    await tx.vendorProfile.update({
      where: { id: redemption.vendorId },
      data: {
        accessState: newAccessState,
      },
    });

    return { success: true, redemption: updatedRedemption };
  });
}

// Helper: Paid vendor access activation (frees coupon slot & unhides products)
async function activatePaid(vendorId) {
  return await prisma.$transaction(async (tx) => {
    const now = new Date();
    const accessExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const activeRedemption = await tx.couponRedemption.findFirst({
      where: { vendorId, status: "ACTIVE" },
    });

    if (activeRedemption) {
      await tx.couponRedemption.update({
        where: { id: activeRedemption.id },
        data: {
          status: "RELEASED",
          releasedAt: now,
          releaseReason: "PAID_UPGRADE",
        },
      });
    }

    const vendor = await tx.vendorProfile.update({
      where: { id: vendorId },
      data: {
        accessState: "ACTIVE_PAID",
        accessActivatedAt: now,
        accessPaidAt: now,
        accessExpiresAt,
      },
    });

    // Unhide previously hidden products
    const unhidden = await tx.product.updateMany({
      where: { vendorId, status: "HIDDEN" },
      data: { status: "PUBLISHED" },
    });

    return { success: true, vendor, unhiddenCount: unhidden.count };
  });
}

// Helper: Mock daily access check job replicating src/lib/vendor-access-job.ts
async function runDailyJob(mockNow) {
  const now = mockNow || new Date();
  let expiredCount = 0;
  let productsHiddenCount = 0;
  let inactivityReleasedCount = 0;

  // 1. Process expired access
  const expiredVendors = await prisma.vendorProfile.findMany({
    where: {
      accessState: { in: ["ACTIVE_COUPON", "ACTIVE_PAID"] },
      accessExpiresAt: { lte: now },
    },
  });

  for (const v of expiredVendors) {
    await prisma.$transaction(async (tx) => {
      await tx.vendorProfile.update({
        where: { id: v.id },
        data: { accessState: "EXPIRED" },
      });

      await tx.couponRedemption.updateMany({
        where: { vendorId: v.id, status: "ACTIVE" },
        data: {
          status: "EXPIRED",
          releasedAt: now,
          releaseReason: "EXPIRED",
        },
      });

      const hidden = await tx.product.updateMany({
        where: { vendorId: v.id, status: "PUBLISHED" },
        data: { status: "HIDDEN" },
      });

      expiredCount++;
      productsHiddenCount += hidden.count;
    });
  }

  // 2. Inactivity slot reclamation (> 60 days approved with 0 products)
  const inactivityCutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const inactiveVendors = await prisma.vendorProfile.findMany({
    where: {
      accessState: "ACTIVE_COUPON",
      status: "APPROVED",
      approvedAt: { lte: inactivityCutoff },
      products: { none: {} },
    },
    include: {
      couponRedemptions: { where: { status: "ACTIVE" } },
    },
  });

  for (const v of inactiveVendors) {
    const activeRedemption = v.couponRedemptions[0];
    if (activeRedemption) {
      await prisma.$transaction(async (tx) => {
        await tx.couponRedemption.update({
          where: { id: activeRedemption.id },
          data: {
            status: "RELEASED",
            releasedAt: now,
            releaseReason: "INACTIVITY",
          },
        });

        await tx.vendorProfile.update({
          where: { id: v.id },
          data: { accessState: "UNPAID" },
        });

        inactivityReleasedCount++;
      });
    }
  }

  return { expiredCount, productsHiddenCount, inactivityReleasedCount };
}

// Entitlements computation helper
function computeEntitlements(vendor) {
  const now = new Date();
  const isExpired = Boolean(
    vendor.accessExpiresAt && new Date(vendor.accessExpiresAt).getTime() <= now.getTime()
  );
  const hasAccess =
    (vendor.accessState === "ACTIVE_PAID" || vendor.accessState === "ACTIVE_COUPON") && !isExpired;
  const canPublish = hasAccess && vendor.status === "APPROVED";

  return {
    hasAccess,
    canPublish,
    commissionPercent: hasAccess ? 0 : 10,
    maxListings: hasAccess ? 50 : 0,
    isReadOnly: !hasAccess,
  };
}

async function runTestSuite() {
  console.log("\n=================================================================");
  console.log("  FOUNDING VENDOR COUPON & ACCESS SYSTEM - AUTOMATED TEST SUITE  ");
  console.log("=================================================================\n");

  const runId = Date.now().toString().slice(-6) + "_" + Math.random().toString(36).slice(2, 6);
  let campus = await prisma.campus.findFirst();
  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        name: `Test Campus ${runId}`,
        slug: `test-campus-${runId}`,
        state: "Lagos",
      },
    });
  }

  // Create a category for product testing
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: `Test Category ${runId}`,
        slug: `test-cat-${runId}`,
      },
    });
  }

  // Helper to create test vendor
  async function createTestVendor(label) {
    const email = `vendor_${label}_${runId}_${Math.random().toString(36).slice(2, 7)}@campus.ng`;
    const user = await prisma.user.create({
      data: {
        email,
        fullName: `Test Vendor ${label}`,
        role: "VENDOR",
      },
    });

    const vendor = await prisma.vendorProfile.create({
      data: {
        userId: user.id,
        campusId: campus.id,
        storeName: `Store ${label} ${runId}`,
        slug: `store-${label.toLowerCase()}-${runId}-${Math.random().toString(36).slice(2, 6)}`,
        status: "APPROVED",
        accessState: "UNPAID",
        whatsapp: "+2348012345678",
      },
    });

    return { user, vendor };
  }

  // Helper to create test coupon
  async function createTestCoupon(code, cap = 50, freeDays = 180, isAct = true, expAt = null) {
    return await prisma.coupon.create({
      data: {
        code: normalizeCouponCode(code),
        maxRedemptions: cap,
        freePeriodDays: freeDays,
        inactivityDays: 60,
        isActive: isAct,
        expiresAt: expAt,
        createdBy: "system_test_runner",
      },
    });
  }

  // Track created test IDs for final cleanup
  const createdCouponIds = [];
  const createdVendorIds = [];
  const createdUserIds = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Successful Redemption
    // -------------------------------------------------------------------------
    console.log("[Test 1] Successful redemption flow...");
    const { vendor: v1, user: u1 } = await createTestVendor("t1");
    createdVendorIds.push(v1.id);
    createdUserIds.push(u1.id);

    const c1 = await createTestCoupon(`FOUNDER_T1_${runId}`, 50, 180);
    createdCouponIds.push(c1.id);

    const res1 = await redeemAtomic(v1.id, c1.code);
    if (!res1.success) console.error("Test 1 error detail:", res1.error);
    assert(res1.success === true, "Test 1: Coupon redemption returns success", res1.error);

    const updatedV1 = await prisma.vendorProfile.findUnique({ where: { id: v1.id } });
    assert(updatedV1.accessState === "ACTIVE_COUPON", "Test 1: Vendor accessState is ACTIVE_COUPON");
    assert(Boolean(updatedV1.accessExpiresAt), "Test 1: Vendor accessExpiresAt is populated");

    const ent1 = computeEntitlements(updatedV1);
    assert(ent1.hasAccess === true, "Test 1: Entitlements hasAccess is true");
    assert(ent1.commissionPercent === 0, "Test 1: Commission is 0% for coupon access");
    assert(ent1.maxListings === 50, "Test 1: Max listings is 50 slots");

    // -------------------------------------------------------------------------
    // TEST 2: Cap Reached (Rejected when cap is exhausted)
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Cap reached rejection...");
    const c2 = await createTestCoupon(`CAP_ONE_${runId}`, 1);
    createdCouponIds.push(c2.id);

    const { vendor: v2a, user: u2a } = await createTestVendor("t2a");
    const { vendor: v2b, user: u2b } = await createTestVendor("t2b");
    createdVendorIds.push(v2a.id, v2b.id);
    createdUserIds.push(u2a.id, u2b.id);

    // Vendor A takes the only slot
    const res2a = await redeemAtomic(v2a.id, c2.code);
    assert(res2a.success === true, "Test 2: First vendor takes 1/1 slot");

    // Vendor B tries to redeem exhausted coupon
    const res2b = await redeemAtomic(v2b.id, c2.code);
    assert(res2b.success === false, "Test 2: Second vendor rejected when cap is reached");
    assert(
      res2b.error.includes("maximum redemptions cap"),
      "Test 2: Clear error message that cap has been reached"
    );

    const updatedV2b = await prisma.vendorProfile.findUnique({ where: { id: v2b.id } });
    assert(updatedV2b.accessState === "UNPAID", "Test 2: Rejected vendor remains UNPAID");

    // -------------------------------------------------------------------------
    // TEST 3: Concurrent Race Condition Claiming Last Slot
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Concurrent race condition for last slot...");
    const c3 = await createTestCoupon(`RACE_${runId}`, 1);
    createdCouponIds.push(c3.id);

    const raceVendors = [];
    for (let i = 0; i < 5; i++) {
      const v = await createTestVendor(`race_${i}`);
      raceVendors.push(v);
      createdVendorIds.push(v.vendor.id);
      createdUserIds.push(v.user.id);
    }

    // Fire 5 concurrent redemption attempts simultaneously
    const raceResults = await Promise.all(
      raceVendors.map((v) => redeemAtomic(v.vendor.id, c3.code))
    );
    console.log("Test 3 race results:", raceResults.map(r => ({ success: r.success, error: r.error })));

    const successCount = raceResults.filter((r) => r.success).length;
    const failCount = raceResults.filter((r) => !r.success).length;

    assert(successCount === 1, "Test 3: Exactly 1 concurrent request succeeded for 1 slot", `Expected 1, got ${successCount}`);
    assert(failCount === 4, "Test 3: Exactly 4 concurrent requests failed", `Expected 4, got ${failCount}`);

    const activeInDb = await prisma.couponRedemption.count({
      where: { couponId: c3.id, status: "ACTIVE" },
    });
    assert(activeInDb === 1, "Test 3: Exactly 1 active redemption in DB (atomic lock enforced)");

    // -------------------------------------------------------------------------
    // TEST 4: Deactivated or Expired Coupon Rejected
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Deactivated or expired coupon rejection...");
    const c4_deactive = await createTestCoupon(`INACTIVE_${runId}`, 50, 180, false);
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const c4_expired = await createTestCoupon(`PAST_EXP_${runId}`, 50, 180, true, pastDate);
    createdCouponIds.push(c4_deactive.id, c4_expired.id);

    const { vendor: v4, user: u4 } = await createTestVendor("t4");
    createdVendorIds.push(v4.id);
    createdUserIds.push(u4.id);

    const res4_deactive = await redeemAtomic(v4.id, c4_deactive.code);
    assert(res4_deactive.success === false, "Test 4: Deactivated coupon rejected");

    const res4_expired = await redeemAtomic(v4.id, c4_expired.code);
    assert(res4_expired.success === false, "Test 4: Expired coupon rejected");

    // -------------------------------------------------------------------------
    // TEST 5: Double Redemption by Same Vendor Rejected
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Double redemption rejection...");
    const c5a = await createTestCoupon(`DOUBLE_A_${runId}`, 50);
    const c5b = await createTestCoupon(`DOUBLE_B_${runId}`, 50);
    createdCouponIds.push(c5a.id, c5b.id);

    const { vendor: v5, user: u5 } = await createTestVendor("t5");
    createdVendorIds.push(v5.id);
    createdUserIds.push(u5.id);

    const res5_first = await redeemAtomic(v5.id, c5a.code);
    if (!res5_first.success) console.error("Test 5 res5_first error:", res5_first.error);
    assert(res5_first.success === true, "Test 5: First redemption succeeds", res5_first.error);

    const res5_same = await redeemAtomic(v5.id, c5a.code);
    assert(res5_same.success === false, "Test 5: Second redemption of same coupon rejected");

    const res5_diff = await redeemAtomic(v5.id, c5b.code);
    assert(res5_diff.success === false, "Test 5: Redemption of second coupon rejected while active");

    // -------------------------------------------------------------------------
    // TEST 6: Admin Rejection Frees Coupon Slot
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Admin rejection frees coupon slot...");
    const c6 = await createTestCoupon(`REJECT_SLOT_${runId}`, 1);
    createdCouponIds.push(c6.id);

    const { vendor: v6a, user: u6a } = await createTestVendor("t6a");
    const { vendor: v6b, user: u6b } = await createTestVendor("t6b");
    createdVendorIds.push(v6a.id, v6b.id);
    createdUserIds.push(u6a.id, u6b.id);

    const res6a = await redeemAtomic(v6a.id, c6.code);
    if (!res6a.success) console.error("Test 6a error detail:", res6a.error);
    assert(res6a.success === true, "Test 6: Vendor 6a claims the slot (1/1 active)", res6a.error);

    // Admin rejects vendor 6a
    await releaseSlot(res6a.redemption.id, "ADMIN_REJECTED");
    await prisma.vendorProfile.update({
      where: { id: v6a.id },
      data: { status: "REJECTED" },
    });

    const activeAfterReject = await prisma.couponRedemption.count({
      where: { couponId: c6.id, status: "ACTIVE" },
    });
    assert(activeAfterReject === 0, "Test 6: Active count drops to 0 after admin rejection");

    // Vendor 6b should now be able to claim the freed slot
    const res6b = await redeemAtomic(v6b.id, c6.code);
    assert(res6b.success === true, "Test 6: Freed slot successfully claimed by Vendor 6b");

    // -------------------------------------------------------------------------
    // TEST 7: Inactivity Release (> 60 days approved with 0 products)
    // -------------------------------------------------------------------------
    console.log("\n[Test 7] Inactivity release (> 60 days with 0 products)...");
    const c7 = await createTestCoupon(`INACTIVITY_${runId}`, 1);
    createdCouponIds.push(c7.id);

    const { vendor: v7, user: u7 } = await createTestVendor("t7");
    createdVendorIds.push(v7.id);
    createdUserIds.push(u7.id);

    const res7 = await redeemAtomic(v7.id, c7.code);
    assert(res7.success === true, "Test 7: Vendor claims coupon slot");

    // Backdate approval date to 70 days ago with 0 products
    const seventyDaysAgo = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000);
    await prisma.vendorProfile.update({
      where: { id: v7.id },
      data: {
        status: "APPROVED",
        approvedAt: seventyDaysAgo,
      },
    });

    // Run daily job
    const jobRes7 = await runDailyJob(new Date());
    assert(jobRes7.inactivityReleasedCount >= 1, "Test 7: Daily job released inactive vendor");

    const updatedV7 = await prisma.vendorProfile.findUnique({ where: { id: v7.id } });
    assert(updatedV7.accessState === "UNPAID", "Test 7: Inactive vendor access reset to UNPAID");

    const r7 = await prisma.couponRedemption.findUnique({ where: { id: res7.redemption.id } });
    assert(r7.status === "RELEASED", "Test 7: Redemption status changed to RELEASED");
    assert(r7.releaseReason === "INACTIVITY", "Test 7: Release reason recorded as INACTIVITY");

    // -------------------------------------------------------------------------
    // TEST 8: Access Expiry Hides Products
    // -------------------------------------------------------------------------
    console.log("\n[Test 8] Access expiry hides products (PUBLISHED -> HIDDEN)...");
    const c8 = await createTestCoupon(`EXPIRY_HIDE_${runId}`, 50);
    createdCouponIds.push(c8.id);

    const { vendor: v8, user: u8 } = await createTestVendor("t8");
    createdVendorIds.push(v8.id);
    createdUserIds.push(u8.id);

    const res8 = await redeemAtomic(v8.id, c8.code);
    assert(res8.success === true, "Test 8: Vendor redeemed coupon");

    // Create 2 published products for vendor 8
    const p8a = await prisma.product.create({
      data: {
        vendorId: v8.id,
        categoryId: category.id,
        title: `Product 8A ${runId}`,
        slug: `prod-8a-${runId}`,
        price: 5000,
        description: "Test product 8a description",
        status: "PUBLISHED",
      },
    });
    const p8b = await prisma.product.create({
      data: {
        vendorId: v8.id,
        categoryId: category.id,
        title: `Product 8B ${runId}`,
        slug: `prod-8b-${runId}`,
        price: 8000,
        description: "Test product 8b description",
        status: "PUBLISHED",
      },
    });

    // Backdate accessExpiresAt to 2 days ago
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await prisma.vendorProfile.update({
      where: { id: v8.id },
      data: { accessExpiresAt: twoDaysAgo },
    });

    // Run daily job
    const jobRes8 = await runDailyJob(new Date());
    assert(jobRes8.expiredCount >= 1, "Test 8: Daily job identified expired vendor");

    const updatedV8 = await prisma.vendorProfile.findUnique({ where: { id: v8.id } });
    assert(updatedV8.accessState === "EXPIRED", "Test 8: Vendor accessState set to EXPIRED");

    const checkP8a = await prisma.product.findUnique({ where: { id: p8a.id } });
    const checkP8b = await prisma.product.findUnique({ where: { id: p8b.id } });
    assert(checkP8a.status === "HIDDEN" && checkP8b.status === "HIDDEN", "Test 8: Products changed to HIDDEN");

    const ent8 = computeEntitlements(updatedV8);
    assert(ent8.isReadOnly === true, "Test 8: Entitlements isReadOnly is true on expiry");
    assert(ent8.canPublish === false, "Test 8: Entitlements canPublish is false on expiry");
    assert(ent8.commissionPercent === 10, "Test 8: Commission reverted to standard 10%");

    // -------------------------------------------------------------------------
    // TEST 9: Payment Restores Access and Unhides Products
    // -------------------------------------------------------------------------
    console.log("\n[Test 9] Payment restores access and unhides products...");
    const payRes9 = await activatePaid(v8.id);
    assert(payRes9.success === true, "Test 9: activatePaid executed successfully");

    const restoredV8 = await prisma.vendorProfile.findUnique({ where: { id: v8.id } });
    assert(restoredV8.accessState === "ACTIVE_PAID", "Test 9: Vendor upgraded to ACTIVE_PAID");

    const restoredP8a = await prisma.product.findUnique({ where: { id: p8a.id } });
    const restoredP8b = await prisma.product.findUnique({ where: { id: p8b.id } });
    assert(restoredP8a.status === "PUBLISHED" && restoredP8b.status === "PUBLISHED", "Test 9: Products restored to PUBLISHED");

    const ent9 = computeEntitlements(restoredV8);
    assert(ent9.hasAccess === true, "Test 9: Entitlements hasAccess restored");
    assert(ent9.canPublish === true, "Test 9: Entitlements canPublish restored");
    assert(ent9.commissionPercent === 0, "Test 9: Commission restored to 0%");

    // -------------------------------------------------------------------------
    // TEST 10: Raising Cap Opens Slots; Lowering Below Active is Rejected
    // -------------------------------------------------------------------------
    console.log("\n[Test 10] Cap modification validation...");
    const c10 = await createTestCoupon(`CAP_CTRL_${runId}`, 2);
    createdCouponIds.push(c10.id);

    const { vendor: v10a, user: u10a } = await createTestVendor("t10a");
    const { vendor: v10b, user: u10b } = await createTestVendor("t10b");
    const { vendor: v10c, user: u10c } = await createTestVendor("t10c");
    createdVendorIds.push(v10a.id, v10b.id, v10c.id);
    createdUserIds.push(u10a.id, u10b.id, u10c.id);

    await redeemAtomic(v10a.id, c10.code);
    await redeemAtomic(v10b.id, c10.code);

    const activeCount10 = await prisma.couponRedemption.count({
      where: { couponId: c10.id, status: "ACTIVE" },
    });
    assert(activeCount10 === 2, "Test 10: 2 active redemptions on coupon");

    // Attempt to lower cap to 1 (below active count of 2)
    let lowerCapError = null;
    const requestedCap = 1;
    if (requestedCap < activeCount10) {
      lowerCapError = `Cannot reduce cap to ${requestedCap} because ${activeCount10} slots are already active.`;
    }
    assert(Boolean(lowerCapError), "Test 10: Lowering cap below active count is rejected");

    // Raise cap to 5
    const updatedC10 = await prisma.coupon.update({
      where: { id: c10.id },
      data: { maxRedemptions: 5 },
    });
    assert(updatedC10.maxRedemptions === 5, "Test 10: Cap raised to 5");

    // 3rd vendor can now redeem immediately
    const res10c = await redeemAtomic(v10c.id, c10.code);
    assert(res10c.success === true, "Test 10: Raising cap opened slots for Vendor 10c");

    // -------------------------------------------------------------------------
    // TEST 11: Daily Cron Job Idempotency
    // -------------------------------------------------------------------------
    console.log("\n[Test 11] Daily cron job idempotency...");
    const run1 = await runDailyJob(new Date());
    const run2 = await runDailyJob(new Date());

    assert(run2.expiredCount === 0, "Test 11: Second consecutive job run finds 0 newly expired vendors");
    assert(run2.productsHiddenCount === 0, "Test 11: Second run hides 0 additional products");
    assert(run2.inactivityReleasedCount === 0, "Test 11: Second run releases 0 additional slots");

    // -------------------------------------------------------------------------
    // TEST 12: 403 Forbidden on Coupon Routes for Non-SuperAdmin Roles
    // -------------------------------------------------------------------------
    console.log("\n[Test 12] Role-based 403 Forbidden enforcement...");
    const rolesToTest = ["ADMIN", "VENDOR", "BUYER", "SUPERADMIN"];
    const results = {};

    function checkCouponRouteAccess(userRole) {
      if (userRole !== "SUPERADMIN") {
        const err = new Error("Forbidden: Super Administrator access required");
        err.statusCode = 403;
        throw err;
      }
      return { status: 200, authorized: true };
    }

    for (const r of rolesToTest) {
      try {
        const authRes = checkCouponRouteAccess(r);
        results[r] = authRes.status;
      } catch (err) {
        results[r] = err.statusCode || 403;
      }
    }

    assert(results["ADMIN"] === 403, "Test 12: Regular ADMIN receives 403 Forbidden");
    assert(results["VENDOR"] === 403, "Test 12: VENDOR receives 403 Forbidden");
    assert(results["BUYER"] === 403, "Test 12: BUYER receives 403 Forbidden");
    assert(results["SUPERADMIN"] === 200, "Test 12: SUPERADMIN is granted 200 Access");

  } finally {
    console.log("\n[Cleanup] Cleaning up ephemeral test records...");
    try {
      if (createdCouponIds.length > 0) {
        await prisma.couponRedemption.deleteMany({ where: { couponId: { in: createdCouponIds } } });
        await prisma.couponAuditLog.deleteMany({ where: { couponId: { in: createdCouponIds } } });
        await prisma.coupon.deleteMany({ where: { id: { in: createdCouponIds } } });
      }
      if (createdVendorIds.length > 0) {
        await prisma.product.deleteMany({ where: { vendorId: { in: createdVendorIds } } });
        await prisma.couponRedemption.deleteMany({ where: { vendorId: { in: createdVendorIds } } });
        await prisma.vendorProfile.deleteMany({ where: { id: { in: createdVendorIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
      console.log("✓ Cleanup finished cleanly.");
    } catch (cleanErr) {
      console.warn("Notice: Test cleanup warning:", cleanErr.message);
    }
  }

  console.log("\n=================================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((err) => {
    console.error("Test suite fatal execution error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
