export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  validateReviewContent,
  recalculateProductRatingAggregates,
  recalculateSellerRatingAggregates,
} from "@/lib/reviews-anti-abuse";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to submit a review." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orderItemId,
      rating,
      comment,
      tags,
      photoPaths,
      sellerRating, // { communication, punctuality, behavior }
    } = body;

    if (!orderItemId) {
      return NextResponse.json(
        { error: "Order item identification is required." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "Product rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // 1. Verify that order item exists, belongs to buyer, and order is confirmed/delivered
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            vendor: true,
          },
        },
        product: true,
        review: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: "Order item not found." },
        { status: 404 }
      );
    }

    // Only buyers with confirmed or delivered order containing that product
    if (orderItem.order.buyerId !== session.userId) {
      return NextResponse.json(
        { error: "You can only review products from your own purchases." },
        { status: 403 }
      );
    }

    const orderStatus = orderItem.order.status;
    if (orderStatus !== "CONFIRMED" && orderStatus !== "DELIVERED") {
      return NextResponse.json(
        {
          error:
            "Reviews can only be submitted after your order is confirmed or delivered by the seller.",
        },
        { status: 400 }
      );
    }

    // Sellers cannot review their own products
    if (orderItem.order.vendor.userId === session.userId) {
      return NextResponse.json(
        { error: "Sellers cannot review their own products." },
        { status: 403 }
      );
    }

    // Enforce one review per order item
    if (orderItem.review) {
      return NextResponse.json(
        { error: "You have already submitted a review for this order item." },
        { status: 400 }
      );
    }

    // 2. Validate comment content
    const validation = validateReviewContent(comment);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Sanitize photo paths (max 3 images)
    let sanitizedPhotos: string[] = [];
    if (Array.isArray(photoPaths)) {
      sanitizedPhotos = photoPaths.slice(0, 3).filter((p) => typeof p === "string" && p.startsWith("http"));
    }

    // Sanitize tags
    let sanitizedTags: string[] = [];
    if (Array.isArray(tags)) {
      sanitizedTags = tags.filter((t) => typeof t === "string").slice(0, 5);
    }

    // 3. Create ProductReview
    const newReview = await prisma.productReview.create({
      data: {
        orderItemId,
        productId: orderItem.productId,
        buyerId: session.userId,
        sellerId: orderItem.order.vendorId,
        rating: Math.round(numRating),
        comment: comment ? comment.trim() : null,
        tags: sanitizedTags.length > 0 ? JSON.stringify(sanitizedTags) : null,
        photoPaths: sanitizedPhotos.length > 0 ? JSON.stringify(sanitizedPhotos) : null,
        status: validation.flaggedReason ? "FLAGGED" : "PUBLISHED",
      },
      include: {
        buyer: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // 4. Handle Optional Separate Seller Rating (1 per order)
    if (
      sellerRating &&
      typeof sellerRating === "object" &&
      sellerRating.communication &&
      sellerRating.punctuality &&
      sellerRating.behavior
    ) {
      const comm = Math.max(1, Math.min(5, Number(sellerRating.communication)));
      const punct = Math.max(1, Math.min(5, Number(sellerRating.punctuality)));
      const behav = Math.max(1, Math.min(5, Number(sellerRating.behavior)));

      await prisma.sellerRating.upsert({
        where: {
          orderId_buyerId: {
            orderId: orderItem.orderId,
            buyerId: session.userId,
          },
        },
        update: {
          communication: comm,
          punctuality: punct,
          behavior: behav,
        },
        create: {
          orderId: orderItem.orderId,
          buyerId: session.userId,
          sellerId: orderItem.order.vendorId,
          communication: comm,
          punctuality: punct,
          behavior: behav,
        },
      });

      // Recalculate seller aggregates
      await recalculateSellerRatingAggregates(orderItem.order.vendorId);
    }

    // Recalculate product aggregates
    await recalculateProductRatingAggregates(orderItem.productId);

    // Suggest dispute if rating is low and tagged with issues
    const suggestDispute =
      sanitizedTags.includes("Not as described") ||
      sanitizedTags.includes("Poor quality") ||
      numRating <= 2;

    return NextResponse.json({
      success: true,
      review: newReview,
      suggestDispute,
    });
  } catch (error: any) {
    console.error("Submit review error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit review." },
      { status: 500 }
    );
  }
}
