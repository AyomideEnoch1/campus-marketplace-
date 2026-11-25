export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { processQueueItem } from "@/lib/email/queue-processor";
import { createAndSendVerificationEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { queueId, logId } = body;

    let targetQueueId = queueId;

    if (!targetQueueId && logId) {
      // Re-create queue item from log record
      const log = await prisma.emailLog.findUnique({
        where: { id: logId },
      });

      if (!log) {
        return NextResponse.json({ error: "Log record not found" }, { status: 404 });
      }

      // If resending a verification email from logs, generate a fresh OTP & link with the user's real details
      if (log.templateId === "buyer_email_verification") {
        const targetUser = await prisma.user.findFirst({
          where: { email: { equals: log.recipient.toLowerCase().trim(), mode: "insensitive" } },
          select: { id: true, email: true, fullName: true },
        });

        if (targetUser) {
          const verificationRes = await createAndSendVerificationEmail({
            userId: targetUser.id,
            email: targetUser.email,
            fullName: targetUser.fullName || undefined,
            origin: req.nextUrl.origin,
          });

          await prisma.activityLog.create({
            data: {
              userId: admin.id,
              action: "EMAIL_MANUALLY_RESENT",
              entityType: "EmailLog",
              entityId: log.id,
              metadataJson: JSON.stringify({ templateId: log.templateId, recipient: log.recipient }),
            },
          });

          return NextResponse.json({ success: true, result: verificationRes.emailResult });
        }
      }

      // Recover original payloadJson from the most recent matching EmailQueue item
      const originalQueue = await prisma.emailQueue.findFirst({
        where: {
          recipient: log.recipient,
          templateId: log.templateId,
        },
        orderBy: { createdAt: "desc" },
        select: { payloadJson: true, metadataJson: true },
      });

      const newQueue = await prisma.emailQueue.create({
        data: {
          recipient: log.recipient,
          subject: log.subject,
          templateId: log.templateId,
          payloadJson: originalQueue?.payloadJson || log.metadataJson || "{}",
          metadataJson: originalQueue?.metadataJson || log.metadataJson || null,
          priority: "HIGH",
          status: "PENDING",
        },
      });

      targetQueueId = newQueue.id;
    }

    if (!targetQueueId) {
      return NextResponse.json({ error: "queueId or logId is required" }, { status: 400 });
    }

    // Reset attempts & trigger immediate processing
    await prisma.emailQueue.update({
      where: { id: targetQueueId },
      data: {
        status: "PENDING",
        attempts: 0,
        nextRetryAt: new Date(),
        error: null,
      },
    });

    const result = await processQueueItem(targetQueueId);

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "EMAIL_MANUALLY_RESENT",
        entityType: "EmailQueue",
        entityId: targetQueueId,
        metadataJson: JSON.stringify({ result }),
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resend email" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
