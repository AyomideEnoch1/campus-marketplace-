export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  validateReviewContent,
  recalculateProductRatingAggregates,
} from "@/lib/reviews-anti-abuse";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const review = await prisma.productReview.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Only review author can edit
    if (review.buyerId !== session.userId) {
      return NextResponse.json(
        { error: "You can only edit your own reviews." },
        { status: 403 }
      );
    }

    // Check 7-day edit window
    const ageMs = Date.now() - new Date(review.createdAt).getTime();
    if (ageMs > SEVEN_DAYS_MS) {
      return NextResponse.json(
        {
          error:
            "This review is locked. Reviews can only be edited within 7 days of posting.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating, comment, tags, photoPaths } = body;

    const numRating = rating ? Number(rating) : review.rating;
    if (numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }

    const validation = validateReviewContent(comment !== undefined ? comment : review.comment);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    let sanitizedPhotos = review.photoPaths;
    if (Array.isArray(photoPaths)) {
      const filtered = photoPaths.slice(0, 3).filter((p) => typeof p === "string" && p.startsWith("http"));
      sanitizedPhotos = filtered.length > 0 ? JSON.stringify(filtered) : null;
    }

    let sanitizedTags = review.tags;
    if (Array.isArray(tags)) {
      const filtered = tags.filter((t) => typeof t === "string").slice(0, 5);
      sanitizedTags = filtered.length > 0 ? JSON.stringify(filtered) : null;
    }

    const updated = await prisma.productReview.update({
      where: { id: params.id },
      data: {
        rating: Math.round(numRating),
        comment: comment !== undefined ? (comment ? comment.trim() : null) : review.comment,
        tags: sanitizedTags,
        photoPaths: sanitizedPhotos,
      },
    });

    await recalculateProductRatingAggregates(review.productId);

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const review = await prisma.productReview.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Only author or admin can delete
    const isAuthor = review.buyerId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Reviews can only be deleted by the author or an admin." },
        { status: 403 }
      );
    }

    await prisma.productReview.delete({
      where: { id: params.id },
    });

    await recalculateProductRatingAggregates(review.productId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
