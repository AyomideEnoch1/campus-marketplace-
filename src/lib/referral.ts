import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const REFERRAL_COOKIE_NAME = "campus_ref";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export const REWARD_CONFIG = {
  BUYER_BONUS: 100,      // ₦100 per registered student buyer
  VENDOR_BONUS: 500,     // ₦500 per registered student vendor
  QUALIFIED_VENDOR_BONUS: 1000, // additional bonus once vendor uploads items
};

export interface ReferralRewardConfig {
  vendorBonus: number;
  buyerBonus: number;
  qualifiedVendorBonus: number;
}

/**
 * Fetch dynamic referral reward config regulated by admin in SiteSettings,
 * with graceful fallback to default REWARD_CONFIG
 */
export async function getReferralRewardConfig(): Promise<ReferralRewardConfig> {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            "ambassador_vendor_reward",
            "ambassador_buyer_reward",
            "ambassador_qualified_vendor_reward",
          ],
        },
      },
    });

    const config: ReferralRewardConfig = {
      vendorBonus: REWARD_CONFIG.VENDOR_BONUS,
      buyerBonus: REWARD_CONFIG.BUYER_BONUS,
      qualifiedVendorBonus: REWARD_CONFIG.QUALIFIED_VENDOR_BONUS,
    };

    settings.forEach((s) => {
      const val = parseFloat(s.value);
      if (!isNaN(val) && val >= 0) {
        if (s.key === "ambassador_vendor_reward") config.vendorBonus = val;
        if (s.key === "ambassador_buyer_reward") config.buyerBonus = val;
        if (s.key === "ambassador_qualified_vendor_reward") config.qualifiedVendorBonus = val;
      }
    });

    return config;
  } catch (err) {
    console.error("Error reading referral reward config:", err);
    return {
      vendorBonus: REWARD_CONFIG.VENDOR_BONUS,
      buyerBonus: REWARD_CONFIG.BUYER_BONUS,
      qualifiedVendorBonus: REWARD_CONFIG.QUALIFIED_VENDOR_BONUS,
    };
  }
}

/**
 * Fetch ambassador payout request lock status regulated by Super Admin in SiteSetting.
 * Returns true if locked (requests disabled), false if unlocked (requests allowed).
 */
export async function getAmbassadorPayoutLockStatus(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "ambassador_payout_requests_locked" },
    });
    return setting?.value === "true";
  } catch (err) {
    console.error("Error reading ambassador payout lock status:", err);
    return false;
  }
}

export interface AmbassadorBannerConfig {
  enabled: boolean;
  message: string;
  title?: string;
  type?: "info" | "warning" | "success" | "announcement";
  updatedAt?: string;
}

/**
 * Fetch announcement banner for the Ambassador Hub, written by Super Admin.
 */
export async function getAmbassadorDashboardBanner(): Promise<AmbassadorBannerConfig> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "ambassador_dashboard_banner" },
    });
    if (!setting || !setting.value) {
      return { enabled: false, message: "", type: "info" };
    }
    const parsed = JSON.parse(setting.value);
    return {
      enabled: Boolean(parsed.enabled),
      message: typeof parsed.message === "string" ? parsed.message : "",
      title: typeof parsed.title === "string" ? parsed.title : "",
      type: ["info", "warning", "success", "announcement"].includes(parsed.type)
        ? parsed.type
        : "info",
      updatedAt: parsed.updatedAt,
    };
  } catch (err) {
    console.error("Error reading ambassador dashboard banner:", err);
    return { enabled: false, message: "", type: "info" };
  }
}

/**
 * Increment ambassador click/scan count idempotently
 */
export async function recordReferralClick(code: string) {
  try {
    const cleanCode = code.trim().toUpperCase();
    await prisma.ambassadorProfile.updateMany({
      where: {
        referralCode: {
          equals: cleanCode,
          mode: "insensitive",
        },
        status: "ACTIVE",
      },
      data: {
        totalClicks: { increment: 1 },
      },
    });
  } catch (err) {
    console.error("Error recording referral click:", err);
  }
}

/**
 * Link a newly registered user to an ambassador if a referral code is provided
 * Checks both explicit code and 30-day cookie
 */
export async function attributeReferral({
  newUserId,
  role,
  explicitCode,
}: {
  newUserId: string;
  role: "BUYER" | "VENDOR";
  explicitCode?: string | null;
}) {
  try {
    let codeToUse = explicitCode?.trim().toUpperCase();

    if (!codeToUse) {
      try {
        const cookieStore = cookies();
        codeToUse = cookieStore.get(REFERRAL_COOKIE_NAME)?.value?.trim().toUpperCase();
      } catch {
        // cookies() may not be available in non-request contexts
      }
    }

    if (!codeToUse) return null;

    // Look up active ambassador
    const ambassador = await prisma.ambassadorProfile.findFirst({
      where: {
        referralCode: {
          equals: codeToUse,
          mode: "insensitive",
        },
        status: "ACTIVE",
      },
    });

    if (!ambassador) return null;

    // Prevent self-referral
    if (ambassador.userId === newUserId) return null;

    // Regulated reward amount based on role
    const config = await getReferralRewardConfig();
    const rewardAmount = role === "VENDOR" ? config.vendorBonus : config.buyerBonus;

    // Create the referral record
    const referral = await prisma.referral.create({
      data: {
        ambassadorId: ambassador.id,
        referredUserId: newUserId,
        roleAtSignup: role,
        rewardAmount: rewardAmount,
        rewardStatus: "PENDING",
        isQualified: false,
        notes: `Referred via code ${codeToUse} as ${role}`,
      },
    });

    // Update ambassador's pending earnings
    await prisma.ambassadorProfile.update({
      where: { id: ambassador.id },
      data: {
        pendingEarnings: { increment: rewardAmount },
        totalEarnings: { increment: rewardAmount },
      },
    });

    return referral;
  } catch (err) {
    console.error("Error attributing referral:", err);
    return null;
  }
}

/**
 * Marks a vendor referral as qualified once the vendor publishes a product or gets verified
 */
export async function qualifyVendorReferral(userId: string) {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referredUserId: userId },
    });

    if (!referral || referral.isQualified) return;

    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        isQualified: true,
        rewardStatus: "APPROVED",
      },
    });
  } catch (err) {
    console.error("Error qualifying vendor referral:", err);
  }
}
