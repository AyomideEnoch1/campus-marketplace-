import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recalculateProductRatingAggregates } from "@/lib/reviews-anti-abuse";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { action } = body; // "PUBLISH" | "HIDE" | "DELETE" | "DISMISS_REPORTS"

    const review = await prisma.productReview.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (action === "DELETE") {
      await prisma.productReview.delete({
        where: { id: params.id },
      });
      await recalculateProductRatingAggregates(review.productId);

      await prisma.activityLog.create({
        data: {
          userId: admin.id,
          action: "REVIEW_DELETED_BY_ADMIN",
          entityType: "ProductReview",
          entityId: params.id,
        },
      });

      return NextResponse.json({ success: true, deleted: true });
    }

    let newStatus = review.status;
    if (action === "PUBLISH") newStatus = "PUBLISHED";
    if (action === "HIDE") newStatus = "HIDDEN";

    if (action === "DISMISS_REPORTS") {
      await prisma.reviewReport.updateMany({
        where: { reviewId: params.id },
        data: { status: "DISMISSED" },
      });
      newStatus = "PUBLISHED";
    }

    const updated = await prisma.productReview.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    await recalculateProductRatingAggregates(review.productId);

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: `REVIEW_MODERATED_${action}`,
        entityType: "ProductReview",
        entityId: params.id,
      },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to moderate review" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
