export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { processQueueItem } from "@/lib/email/queue-processor";

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

      const newQueue = await prisma.emailQueue.create({
        data: {
          recipient: log.recipient,
          subject: log.subject,
          templateId: log.templateId,
          payloadJson: log.metadataJson || "{}",
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
