import { prisma } from "@/lib/prisma";

// Contact info and off-platform payment patterns
const PROHIBITED_PAYMENT_PATTERNS = [
  /pay (me )?directly/i,
  /send (the )?money to/i,
  /pay to (my )?(opay|palmpay|kuda|account|bank)/i,
  /transfer (directly|outside)/i,
  /dm (me )?for (bank|payment|transfer)/i,
  /call me on/i,
  /whatsapp me/i,
  /wa\.me\//i,
];

// Nigerian phone numbers & generic phone regex
const PHONE_PATTERN = /(\+?234|0)[789][01]\d{8}/;

// External URLs & Links regex
const URL_PATTERN = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|ng|net|org|edu|io)[^\s]*)/i;

// Basic abusive language / slur filter
const PROFANITY_WORDS = [
  "scam",
  "thief",
  "ole",
  "bastard",
  "idiot",
  "stupid",
  "fool",
  "fuck",
  "bitch",
  "shit",
  "mad person",
  "werey",
];

export interface ContentValidationResult {
  isValid: boolean;
  error?: string;
  flaggedReason?: string;
}

export function validateReviewContent(comment?: string | null): ContentValidationResult {
  if (!comment || comment.trim().length === 0) {
    return { isValid: true };
  }

  const text = comment.trim();

  // Length check (max 1,000 characters per specification)
  if (text.length > 1000) {
    return {
      isValid: false,
      error: "Review comment exceeds maximum limit of 1,000 characters.",
    };
  }

  // Check for external links
  if (URL_PATTERN.test(text)) {
    return {
      isValid: false,
      error: "For campus safety, external web links and URLs are not permitted in reviews.",
    };
  }

  // Check for personal phone numbers
  if (PHONE_PATTERN.test(text)) {
    return {
      isValid: false,
      error: "For student privacy, phone numbers cannot be posted in public reviews.",
    };
  }

  // Check for off-platform payment solicitation
  for (const pattern of PROHIBITED_PAYMENT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isValid: false,
        error: "Off-platform payment language is prohibited. All transactions must adhere to campus safety guidelines.",
      };
    }
  }

  // Check for abusive language
  const lower = text.toLowerCase();
  for (const badWord of PROFANITY_WORDS) {
    if (lower.includes(badWord)) {
      return {
        isValid: false,
        error: "Your review contains restricted language. Please keep campus feedback respectful and constructive.",
        flaggedReason: "ABUSIVE_LANGUAGE",
      };
    }
  }

  return { isValid: true };
}

/**
 * Updates Product aggregates (reviewCount, avgRating, ratingBreakdown)
 * Ensures consistency across SQLite dev mode and PostgreSQL production.
 */
export async function recalculateProductRatingAggregates(productId: string) {
  try {
    const reviews = await prisma.productReview.findMany({
      where: { productId, status: "PUBLISHED" },
      select: { rating: true },
    });

    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0.0;

    const breakdown: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    reviews.forEach((r) => {
      const key = String(r.rating);
      if (breakdown[key] !== undefined) {
        breakdown[key] += 1;
      }
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        reviewCount: count,
        avgRating: Number(avg.toFixed(1)),
        ratingBreakdown: JSON.stringify(breakdown),
      },
    });
  } catch (err) {
    console.error("Failed to recalculate product rating aggregates:", err);
  }
}

/**
 * Updates VendorProfile aggregates (sellerAvgRating, sellerReviewCount, communicationAvg, punctualityAvg, behaviorAvg)
 */
export async function recalculateSellerRatingAggregates(sellerId: string) {
  try {
    const ratings = await prisma.sellerRating.findMany({
      where: { sellerId },
      select: { communication: true, punctuality: true, behavior: true },
    });

    const count = ratings.length;
    if (count === 0) {
      await prisma.vendorProfile.update({
        where: { id: sellerId },
        data: {
          sellerReviewCount: 0,
          sellerAvgRating: 0.0,
          communicationAvg: 0.0,
          punctualityAvg: 0.0,
          behaviorAvg: 0.0,
        },
      });
      return;
    }

    const commAvg = ratings.reduce((sum, r) => sum + r.communication, 0) / count;
    const punctAvg = ratings.reduce((sum, r) => sum + r.punctuality, 0) / count;
    const behavAvg = ratings.reduce((sum, r) => sum + r.behavior, 0) / count;
    const overall = (commAvg + punctAvg + behavAvg) / 3.0;

    await prisma.vendorProfile.update({
      where: { id: sellerId },
      data: {
        sellerReviewCount: count,
        communicationAvg: Number(commAvg.toFixed(1)),
        punctualityAvg: Number(punctAvg.toFixed(1)),
        behaviorAvg: Number(behavAvg.toFixed(1)),
        sellerAvgRating: Number(overall.toFixed(1)),
      },
    });
  } catch (err) {
    console.error("Failed to recalculate seller rating aggregates:", err);
  }
}
