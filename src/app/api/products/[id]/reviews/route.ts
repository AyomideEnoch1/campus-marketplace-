export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { clampLimit, clampPage } from "@/lib/db/selects";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`api:reviews:${ip}`, 60, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const ratingFilter = searchParams.get("rating");
    const withPhotos = searchParams.get("withPhotos") === "true";
    const sort = searchParams.get("sort") || "newest"; // helpful | newest | highest | lowest
    const page = clampPage(searchParams.get("page"));
    const limit = clampLimit(searchParams.get("limit"), 15, 24);

    // 1. Aggregate rating breakdown in SQL instead of fetching every review row
    const groupedRatings = await prisma.productReview.groupBy({
      by: ["rating"],
      where: {
        productId: params.id,
        status: "PUBLISHED",
      },
      _count: { rating: true },
    });

    const breakdown: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    let totalCount = 0;
    let weightedSum = 0;
    groupedRatings.forEach((row) => {
      const k = String(row.rating);
      if (breakdown[k] !== undefined) {
        breakdown[k] = row._count.rating;
      }
      totalCount += row._count.rating;
      weightedSum += row.rating * row._count.rating;
    });

    const avgRating =
      totalCount > 0 ? Number((weightedSum / totalCount).toFixed(1)) : 0;

    // 2. Build filtered query
    const whereClause: any = {
      productId: params.id,
      status: "PUBLISHED",
    };

    if (ratingFilter && ["1", "2", "3", "4", "5"].includes(ratingFilter)) {
      whereClause.rating = Number(ratingFilter);
    }

    if (withPhotos) {
      whereClause.photoPaths = { not: null };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "helpful") orderBy = { helpfulCount: "desc" };
    else if (sort === "highest") orderBy = { rating: "desc" };
    else if (sort === "lowest") orderBy = { rating: "asc" };

    const reviews = await prisma.productReview.findMany({
      where: whereClause,
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        tags: true,
        photoPaths: true,
        helpfulCount: true,
        buyerId: true,
        createdAt: true,
        buyer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        reply: {
          select: {
            id: true,
            body: true,
            createdAt: true,
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

    const formattedReviews = reviews.map((r) => {
      let displayName = "Student Buyer";
      if (r.buyer?.fullName) {
        const parts = r.buyer.fullName.trim().split(" ");
        displayName =
          parts.length > 1
            ? `${parts[0]} ${parts[parts.length - 1][0]}.`
            : parts[0];
      }

      let parsedTags: string[] = [];
      try {
        if (r.tags) parsedTags = JSON.parse(r.tags);
      } catch {}

      let parsedPhotos: string[] = [];
      try {
        if (r.photoPaths) parsedPhotos = JSON.parse(r.photoPaths);
      } catch {}

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
        isVerifiedPurchase: true,
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

    // 3. Check if current authenticated user has an unreviewed completed order item
    let eligibleOrderItemId: string | null = null;
    let userExistingReview: any = null;

    if (session) {
      const [eligibleItem, existing] = await Promise.all([
        prisma.orderItem.findFirst({
          where: {
            productId: params.id,
            order: {
              buyerId: session.userId,
              status: { in: ["CONFIRMED", "DELIVERED"] },
            },
            review: null,
          },
          select: { id: true },
        }),
        prisma.productReview.findFirst({
          where: {
            productId: params.id,
            buyerId: session.userId,
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

      if (eligibleItem) eligibleOrderItemId = eligibleItem.id;
      if (existing) userExistingReview = existing;
    }

    return NextResponse.json({
      reviews: formattedReviews,
      totalCount,
      avgRating,
      breakdown,
      page,
      limit,
      eligibleOrderItemId,
      hasUserReviewed: Boolean(userExistingReview),
      userExistingReview,
    });
  } catch (error: any) {
    console.error("GET product reviews error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
