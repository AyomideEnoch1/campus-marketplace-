export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateReviewContent } from "@/lib/reviews-anti-abuse";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { body: replyBody } = body;

    if (!replyBody || replyBody.trim().length === 0) {
      return NextResponse.json(
        { error: "Reply body cannot be empty." },
        { status: 400 }
      );
    }

    const validation = validateReviewContent(replyBody);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Find review and verify the seller is replying to review on their product
    const review = await prisma.productReview.findUnique({
      where: { id: params.id },
      include: {
        seller: true,
        reply: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.seller.userId !== session.userId) {
      return NextResponse.json(
        { error: "Only the seller of this product can post a reply." },
        { status: 403 }
      );
    }

    if (review.reply) {
      // Edit existing reply (allowed within 24 hours)
      const ageMs = Date.now() - new Date(review.reply.createdAt).getTime();
      if (ageMs > TWENTY_FOUR_HOURS_MS) {
        return NextResponse.json(
          {
            error:
              "Replies can only be edited within 24 hours of posting.",
          },
          { status: 403 }
        );
      }

      const updated = await prisma.reviewReply.update({
        where: { id: review.reply.id },
        data: { body: replyBody.trim() },
      });

      return NextResponse.json({ success: true, reply: updated });
    }

    // Create new reply
    const created = await prisma.reviewReply.create({
      data: {
        reviewId: params.id,
        sellerId: review.sellerId,
        body: replyBody.trim(),
      },
    });

    return NextResponse.json({ success: true, reply: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
