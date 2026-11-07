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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reason, details } = body;

    const validReasons = ["SPAM", "ABUSIVE_LANGUAGE", "FAKE_REVIEW", "IRRELEVANT"];
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Valid report reason required (SPAM, ABUSIVE_LANGUAGE, FAKE_REVIEW, IRRELEVANT)." },
        { status: 400 }
      );
    }

    const review = await prisma.productReview.findUnique({
      where: { id: params.id },
      include: { reports: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if user already reported this review
    const alreadyReported = review.reports.some(
      (r) => r.reporterId === session.userId
    );
    if (alreadyReported) {
      return NextResponse.json(
        { error: "You have already submitted a report for this review." },
        { status: 400 }
      );
    }

    // Create report
    await prisma.reviewReport.create({
      data: {
        reviewId: params.id,
        reporterId: session.userId,
        reason,
        details: details || null,
        status: "PENDING",
      },
    });

    // Auto-hide review after 3 reports pending admin review
    const totalReports = review.reports.length + 1;
    let autoHidden = false;
    if (totalReports >= 3 && review.status === "PUBLISHED") {
      await prisma.productReview.update({
        where: { id: params.id },
        data: { status: "HIDDEN" },
      });
      autoHidden = true;
    } else if (review.status === "PUBLISHED") {
      await prisma.productReview.update({
        where: { id: params.id },
        data: { status: "FLAGGED" },
      });
    }

    return NextResponse.json({
      success: true,
      message: autoHidden
        ? "Review reported and temporarily hidden pending admin review."
        : "Thank you for your report. It will be reviewed by campus moderators.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
