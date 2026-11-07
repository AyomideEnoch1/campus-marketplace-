import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Please sign in to vote." },
        { status: 401 }
      );
    }

    const review = await prisma.productReview.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Cannot vote on own review
    if (review.buyerId === session.userId) {
      return NextResponse.json(
        { error: "You cannot vote on your own review." },
        { status: 400 }
      );
    }

    // Toggle vote
    const existing = await prisma.reviewHelpfulVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId: params.id,
          userId: session.userId,
        },
      },
    });

    let voted = false;
    if (existing) {
      // Remove vote
      await prisma.reviewHelpfulVote.delete({
        where: {
          reviewId_userId: {
            reviewId: params.id,
            userId: session.userId,
          },
        },
      });
      voted = false;
    } else {
      // Add vote
      await prisma.reviewHelpfulVote.create({
        data: {
          reviewId: params.id,
          userId: session.userId,
        },
      });
      voted = true;
    }

    // Count new total
    const helpfulCount = await prisma.reviewHelpfulVote.count({
      where: { reviewId: params.id },
    });

    await prisma.productReview.update({
      where: { id: params.id },
      data: { helpfulCount },
    });

    return NextResponse.json({ success: true, voted, helpfulCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
