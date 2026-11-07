import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true } },
      },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      totalCount: reviews.length,
      averageRating: Number(averageRating.toFixed(1)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to leave a review" }, { status: 401 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || !comment) {
      return NextResponse.json(
        { error: "Rating (1-5) and comment are required" },
        { status: 400 }
      );
    }

    // Check if user has an order containing this product to verify purchase
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: params.id,
        order: { buyerId: session.userId, status: "DELIVERED" },
      },
    });

    const review = await prisma.review.create({
      data: {
        productId: params.id,
        userId: session.userId,
        rating: Math.max(1, Math.min(5, Number(rating))),
        comment,
        isVerifiedPurchase: Boolean(hasPurchased),
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
