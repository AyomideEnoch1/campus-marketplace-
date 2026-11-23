import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/email";

export interface JobExecutionStats {
  expiredCount: number;
  productsHiddenCount: number;
  inactivityReleasedCount: number;
  inactivityWarningsCount: number;
  expiryRemindersCount: number;
  errors: string[];
}

/**
 * Daily idempotent background job to process vendor access expiry,
 * inactivity slot reclamation, and reminder notifications.
 */
export async function runVendorAccessCheck(): Promise<JobExecutionStats> {
  const now = new Date();
  const stats: JobExecutionStats = {
    expiredCount: 0,
    productsHiddenCount: 0,
    inactivityReleasedCount: 0,
    inactivityWarningsCount: 0,
    expiryRemindersCount: 0,
    errors: [],
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://xn--j-sfa590u.com";

  // =========================================================================
  // 1. PROCESS EXPIRED VENDOR ACCESS (Idempotent)
  // =========================================================================
  try {
    const expiredVendors = await prisma.vendorProfile.findMany({
      where: {
        accessState: { in: ["ACTIVE_COUPON", "ACTIVE_PAID"] },
        accessExpiresAt: { lte: now },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    for (const v of expiredVendors) {
      await prisma.$transaction(async (tx) => {
        // 1. Mark vendor as EXPIRED
        await tx.vendorProfile.update({
          where: { id: v.id },
          data: { accessState: "EXPIRED" },
        });

        // 2. Mark any active coupon redemption as EXPIRED (reopening the slot)
        await tx.couponRedemption.updateMany({
          where: {
            vendorId: v.id,
            status: "ACTIVE",
          },
          data: {
            status: "EXPIRED",
            releasedAt: now,
            releaseReason: "EXPIRED",
          },
        });

        // 3. Hide published products (requirement: HIDDEN, not deleted)
        const hiddenResult = await tx.product.updateMany({
          where: {
            vendorId: v.id,
            status: "PUBLISHED",
          },
          data: {
            status: "HIDDEN",
          },
        });

        stats.productsHiddenCount += hiddenResult.count;

        // 4. Create in-app Notification
        await tx.notification.create({
          data: {
            userId: v.userId,
            type: "SYSTEM",
            title: "Vendor Access Expired",
            message:
              "Your vendor access period has ended and your public listings are temporarily hidden. Please pay to restore full access and restore your products immediately.",
            link: "/dashboard/activate",
          },
        });
      });

      stats.expiredCount++;
    }
  } catch (err: any) {
    console.error("[Job Error - Expiry Processing]:", err);
    stats.errors.push(`Expiry Processing: ${err.message}`);
  }

  // =========================================================================
  // 2. PROCESS INACTIVITY RECLAMATION (Idempotent)
  // Vendors approved with 0 products after inactivityDays lose their slot
  // =========================================================================
  try {
    // Fetch active coupon redemptions for approved vendors
    const activeRedemptions = await prisma.couponRedemption.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        coupon: {
          select: { inactivityDays: true, code: true },
        },
        vendor: {
          select: {
            id: true,
            userId: true,
            storeName: true,
            status: true,
            approvedAt: true,
            createdAt: true,
            user: { select: { email: true, fullName: true } },
            _count: {
              select: {
                products: {
                  where: { status: "PUBLISHED" },
                },
              },
            },
          },
        },
      },
    });

    for (const r of activeRedemptions) {
      const vendor = r.vendor;
      // Inactivity window is measured from approval date (fallback to registration date if approved without timestamp)
      if (vendor.status !== "APPROVED") continue;
      const approvalDate = vendor.approvedAt || vendor.createdAt;
      const inactivityDays = r.coupon?.inactivityDays || 60;
      const msPassed = now.getTime() - new Date(approvalDate).getTime();
      const daysPassed = msPassed / (1000 * 60 * 60 * 24);

      const hasPublished = vendor._count.products > 0;

      // If vendor has published items, they are active!
      if (hasPublished) continue;

      // Condition A: Inactivity reached or exceeded -> Reclaim slot
      if (daysPassed >= inactivityDays) {
        await prisma.$transaction(async (tx) => {
          // Release slot
          await tx.couponRedemption.update({
            where: { id: r.id },
            data: {
              status: "RELEASED",
              releasedAt: now,
              releaseReason: "INACTIVITY",
            },
          });

          // Set vendor access to UNPAID
          await tx.vendorProfile.update({
            where: { id: vendor.id },
            data: {
              accessState: "UNPAID",
              accessExpiresAt: null,
            },
          });

          // Create notification
          await tx.notification.create({
            data: {
              userId: vendor.userId,
              type: "SYSTEM",
              title: "Founding Coupon Slot Reclaimed Due to Inactivity",
              message: `Your founding coupon slot (${r.coupon.code}) has been reclaimed because no products were published within ${inactivityDays} days of approval. You can activate paid access anytime to start selling.`,
              link: "/dashboard/activate",
            },
          });
        });

        stats.inactivityReleasedCount++;
      }
      // Condition B: Warning 7 days before inactivity deadline
      else if (daysPassed >= inactivityDays - 7 && !r.inactivityWarningSentAt) {
        await prisma.$transaction(async (tx) => {
          await tx.couponRedemption.update({
            where: { id: r.id },
            data: { inactivityWarningSentAt: now },
          });

          const daysLeft = Math.max(1, Math.ceil(inactivityDays - daysPassed));
          await tx.notification.create({
            data: {
              userId: vendor.userId,
              type: "SYSTEM",
              title: "Action Required: Publish a Product to Keep Free Access",
              message: `You have ${daysLeft} days remaining to publish your first product, or your Founding Vendor slot (${r.coupon.code}) will be released to another student vendor.`,
              link: "/dashboard/products/new",
            },
          });
        });

        stats.inactivityWarningsCount++;
      }
    }
  } catch (err: any) {
    console.error("[Job Error - Inactivity Processing]:", err);
    stats.errors.push(`Inactivity Processing: ${err.message}`);
  }

  // =========================================================================
  // 3. EXPIRY REMINDERS (30, 7, and 1 Days Before Expiry)
  // =========================================================================
  try {
    const activeVendors = await prisma.vendorProfile.findMany({
      where: {
        accessState: { in: ["ACTIVE_COUPON", "ACTIVE_PAID"] },
        accessExpiresAt: { gt: now },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    for (const v of activeVendors) {
      if (!v.accessExpiresAt) continue;
      const msLeft = new Date(v.accessExpiresAt).getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      // Thresholds: 30 days, 7 days, 1 day
      const is30Day = daysLeft === 30;
      const is7Day = daysLeft === 7;
      const is1Day = daysLeft === 1;

      if (is30Day || is7Day || is1Day) {
        // Check if reminder was already sent today to ensure idempotency
        const reminderKey = `expiry_notice:${v.id}:${daysLeft}d:${now.toISOString().split("T")[0]}`;
        const alreadySent = await prisma.siteSetting.findUnique({
          where: { key: reminderKey },
        });

        if (!alreadySent) {
          await prisma.$transaction(async (tx) => {
            await tx.siteSetting.create({
              data: {
                key: reminderKey,
                value: new Date().toISOString(),
              },
            });

            await tx.notification.create({
              data: {
                userId: v.userId,
                type: "SYSTEM",
                title: `Vendor Access Notice: ${daysLeft} Day${daysLeft > 1 ? "s" : ""} Remaining`,
                message: `Your vendor store access ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Pay now to maintain your live store, listings, and 0% commission entitlements without interruption.`,
                link: "/dashboard/activate",
              },
            });
          });

          stats.expiryRemindersCount++;
        }
      }
    }
  } catch (err: any) {
    console.error("[Job Error - Expiry Reminders]:", err);
    stats.errors.push(`Expiry Reminders: ${err.message}`);
  }

  return stats;
}
