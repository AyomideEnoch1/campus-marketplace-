import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const REFERRAL_COOKIE_NAME = "campus_ref";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export const REWARD_CONFIG = {
  BUYER_BONUS: 100,      // ₦100 per registered student buyer
  VENDOR_BONUS: 500,     // ₦500 per registered student vendor
  QUALIFIED_VENDOR_BONUS: 1000, // additional bonus once vendor uploads items
};

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

    // Initial reward amount based on role
    const rewardAmount = role === "VENDOR" ? REWARD_CONFIG.VENDOR_BONUS : REWARD_CONFIG.BUYER_BONUS;

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
