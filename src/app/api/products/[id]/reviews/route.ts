export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const ratingFilter = searchParams.get("rating");
    const withPhotos = searchParams.get("withPhotos") === "true";
    const sort = searchParams.get("sort") || "newest"; // helpful | newest | highest | lowest

    // 1. Fetch all published reviews to calculate breakdown and average
    const allPublished = await prisma.productReview.findMany({
      where: {
        productId: params.id,
        status: "PUBLISHED",
      },
      select: {
        rating: true,
      },
    });

    const totalCount = allPublished.length;
    const avgRating =
      totalCount > 0
        ? Number(
            (
              allPublished.reduce((sum, r) => sum + r.rating, 0) / totalCount
            ).toFixed(1)
          )
        : 0;

    const breakdown: Record<string, number> = {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0,
    };
    allPublished.forEach((r) => {
      const k = String(r.rating);
      if (breakdown[k] !== undefined) breakdown[k] += 1;
    });

    // 2. Build filtered query
    const whereClause: any = {
      productId: params.id,
      status: "PUBLISHED",
    };

    if (ratingFilter && ["1", "2", "3", "4", "5"].includes(ratingFilter)) {
      whereClause.rating = Number(ratingFilter);
    }

    if (withPhotos) {
      whereClause.photoPaths = {
        not: null,
      };
    }

    // Sort order
    let orderBy: any = { createdAt: "desc" };
    if (sort === "helpful") {
      orderBy = { helpfulCount: "desc" };
    } else if (sort === "highest") {
      orderBy = { rating: "desc" };
    } else if (sort === "lowest") {
      orderBy = { rating: "asc" };
    }

    const reviews = await prisma.productReview.findMany({
      where: whereClause,
      orderBy,
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        reply: {
          include: {
            seller: {
              select: {
                storeName: true,
                logo: true,
              },
            },
          },
        },
        helpfulVotes: session
          ? {
              where: { userId: session.userId },
              select: { userId: true },
            }
        : false,
      },
    });

    // Format reviewer display name: first name + last initial (no full names per spec)
    const formattedReviews = reviews.map((r) => {
      let displayName = "Student Buyer";
      if (r.buyer?.fullName) {
        const parts = r.buyer.fullName.trim().split(" ");
        if (parts.length > 1) {
          displayName = `${parts[0]} ${parts[parts.length - 1][0]}.`;
        } else {
          displayName = parts[0];
        }
      }

      let parsedTags: string[] = [];
      try {
        if (r.tags) parsedTags = JSON.parse(r.tags);
      } catch (e) {}

      let parsedPhotos: string[] = [];
      try {
        if (r.photoPaths) parsedPhotos = JSON.parse(r.photoPaths);
      } catch (e) {}

      const isAuthor = session ? r.buyerId === session.userId : false;
      const canEdit =
        isAuthor &&
        Date.now() - new Date(r.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000;

      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        tags: parsedTags,
        photos: parsedPhotos,
        helpfulCount: r.helpfulCount,
        hasVotedHelpful: session && (r as any).helpfulVotes?.length > 0,
        createdAt: r.createdAt,
        displayName,
        isVerifiedPurchase: true, // by design, reviews are linked to completed order items
        isAuthor,
        canEdit,
        reply: r.reply
          ? {
              id: r.reply.id,
              body: r.reply.body,
              createdAt: r.reply.createdAt,
              storeName: r.reply.seller.storeName,
              storeLogo: r.reply.seller.logo,
            }
          : null,
      };
    });

    // 3. Check if current authenticated user has an unreviewed completed order item for this product
    let eligibleOrderItemId: string | null = null;
    let userExistingReview: any = null;

    if (session) {
      // Find an order item for this product by this buyer
      const eligibleItem = await prisma.orderItem.findFirst({
        where: {
          productId: params.id,
          order: {
            buyerId: session.userId,
            status: { in: ["CONFIRMED", "DELIVERED"] },
          },
          review: null,
        },
        select: { id: true },
      });

      if (eligibleItem) {
        eligibleOrderItemId = eligibleItem.id;
      }

      // Check if user has an existing review
      const existing = await prisma.productReview.findFirst({
        where: {
          productId: params.id,
          buyerId: session.userId,
        },
      });

      if (existing) {
        userExistingReview = existing;
      }
    }

    return NextResponse.json({
      reviews: formattedReviews,
      totalCount,
      avgRating,
      breakdown,
      eligibleOrderItemId,
      hasUserReviewed: Boolean(userExistingReview),
      userExistingReview,
    });
  } catch (error: any) {
    console.error("GET product reviews error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
