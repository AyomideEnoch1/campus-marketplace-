import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputeId = params.id;
    const body = await req.json();
    const { responseText, evidenceUrls } = body;

    if (!responseText && (!evidenceUrls || evidenceUrls.length === 0)) {
      return NextResponse.json(
        { error: "A response message or evidence files are required." },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status !== "open" && dispute.status !== "under_review") {
      return NextResponse.json(
        { error: `Cannot respond: dispute has already been resolved (${dispute.status}).` },
        { status: 400 }
      );
    }

    const isBuyer = dispute.buyerId === session.id;
    const isSeller = dispute.order.vendor.userId === session.id;
    const isAdmin = (session as any).role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: "Only the buyer, seller, or an administrator can participate in this dispute." },
        { status: 403 }
      );
    }

    // Parse existing evidence payload
    let currentEvidence: any = {};
    if (dispute.evidencePaths) {
      try {
        currentEvidence = JSON.parse(dispute.evidencePaths);
      } catch {
        currentEvidence = { raw: dispute.evidencePaths };
      }
    }

    const now = new Date().toISOString();

    if (isSeller) {
      currentEvidence.sellerResponse = responseText || currentEvidence.sellerResponse;
      currentEvidence.sellerRespondedAt = now;
      if (evidenceUrls && Array.isArray(evidenceUrls)) {
        currentEvidence.sellerEvidence = [
          ...(currentEvidence.sellerEvidence || []),
          ...evidenceUrls,
        ];
      }
    } else if (isBuyer) {
      if (responseText) {
        currentEvidence.buyerFollowups = [
          ...(currentEvidence.buyerFollowups || []),
          { note: responseText, timestamp: now },
        ];
      }
      if (evidenceUrls && Array.isArray(evidenceUrls)) {
        currentEvidence.buyerEvidence = [
          ...(currentEvidence.buyerEvidence || []),
          ...evidenceUrls,
        ];
      }
    } else if (isAdmin) {
      currentEvidence.adminNotes = [
        ...(currentEvidence.adminNotes || []),
        { note: responseText, timestamp: now, adminId: session.id },
      ];
    }

    // Update dispute status to under_review once seller responds
    const updatedDispute = await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        evidencePaths: JSON.stringify(currentEvidence),
        status: "under_review",
      },
    });

    // Notify the other party
    if (isSeller && dispute.buyerId) {
      await createNotification({
        userId: dispute.buyerId,
        type: "ORDER_STATUS",
        title: "Seller Responded to Dispute",
        message: `The seller responded to your dispute on Order #${dispute.order.orderNumber}. Platform mediators are reviewing both submissions.`,
        link: `/orders/${dispute.order.id}`,
      }).catch(() => {});
    } else if (isBuyer && dispute.order.vendor?.userId) {
      await createNotification({
        userId: dispute.order.vendor.userId,
        type: "ORDER_STATUS",
        title: "Buyer Added Dispute Information",
        message: `The buyer submitted additional evidence for Order #${dispute.order.orderNumber}.`,
        link: `/dashboard/orders`,
      }).catch(() => {});
    }

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: session.id,
        action: isSeller ? "DISPUTE_SELLER_RESPONSE" : isBuyer ? "DISPUTE_BUYER_EVIDENCE" : "DISPUTE_ADMIN_NOTE",
        entityType: "DISPUTE",
        entityId: dispute.id,
        metadataJson: JSON.stringify({
          orderId: dispute.orderId,
          orderNumber: dispute.order.orderNumber,
          role: isSeller ? "seller" : isBuyer ? "buyer" : "admin",
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Dispute response recorded successfully.",
      status: "under_review",
      dispute: updatedDispute,
    });
  } catch (error: any) {
    console.error("[Dispute Response Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit dispute response" },
      { status: 500 }
    );
  }
}
