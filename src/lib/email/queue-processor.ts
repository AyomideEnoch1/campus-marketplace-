import { prisma } from "@/lib/prisma";
import { renderEmailTemplate } from "./templates";
import { sendEmailDirect } from "./sender";

export interface QueueProcessingSummary {
  processed: number;
  succeeded: number;
  failed: number;
  suppressed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Exponential backoff calculation in minutes based on attempt count
 */
function getBackoffMinutes(attempts: number): number {
  switch (attempts) {
    case 1:
      return 2; // 2 minutes
    case 2:
      return 10; // 10 minutes
    case 3:
      return 30; // 30 minutes
    case 4:
      return 120; // 2 hours
    default:
      return 360; // 6 hours
  }
}

/**
 * Process a single email queue item by ID (used for immediate dispatch or manual retry)
 */
export async function processQueueItem(queueId: string): Promise<{
  success: boolean;
  error?: string;
  simulated?: boolean;
}> {
  const item = await prisma.emailQueue.findUnique({
    where: { id: queueId },
  });

  if (!item) {
    return { success: false, error: "Queue item not found" };
  }

  // 1. Check suppression list
  const isSuppressed = await prisma.emailSuppression.findUnique({
    where: { email: item.recipient.toLowerCase().trim() },
  });

  if (isSuppressed) {
    const errorMsg = `Suppressed recipient (${isSuppressed.reason}): ${isSuppressed.details || "No send allowed"}`;
    await prisma.$transaction([
      prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status: "FAILED",
          error: errorMsg,
          updatedAt: new Date(),
        },
      }),
      prisma.emailLog.create({
        data: {
          recipient: item.recipient,
          subject: item.subject,
          templateId: item.templateId,
          status: "BOUNCED",
          error: errorMsg,
        },
      }),
    ]);
    return { success: false, error: errorMsg };
  }

  // 2. Render template
  let payload: any = {};
  try {
    payload = JSON.parse(item.payloadJson || "{}");
  } catch (err: any) {
    const errorMsg = `Invalid JSON payload: ${err.message}`;
    await prisma.emailQueue.update({
      where: { id: item.id },
      data: { status: "FAILED", error: errorMsg },
    });
    return { success: false, error: errorMsg };
  }

  let rendered;
  try {
    rendered = renderEmailTemplate(item.templateId, payload);
  } catch (err: any) {
    const errorMsg = `Template render failed: ${err.message}`;
    await prisma.emailQueue.update({
      where: { id: item.id },
      data: { status: "FAILED", error: errorMsg },
    });
    return { success: false, error: errorMsg };
  }

  // 3. Mark processing
  await prisma.emailQueue.update({
    where: { id: item.id },
    data: { status: "PROCESSING" },
  });

  // 4. Send via provider
  const result = await sendEmailDirect({
    to: item.recipient,
    subject: item.subject || rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  const now = new Date();

  if (result.success) {
    await prisma.$transaction([
      prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status: "SENT",
          sentAt: now,
          error: null,
          updatedAt: now,
        },
      }),
      prisma.emailLog.create({
        data: {
          recipient: item.recipient,
          subject: item.subject || rendered.subject,
          templateId: item.templateId,
          status: result.simulated ? "SIMULATED" : "SENT",
          providerMessageId: result.messageId || null,
          metadataJson: item.payloadJson || item.metadataJson,
          sentAt: now,
        },
      }),
    ]);
    return { success: true, simulated: result.simulated };
  } else {
    const nextAttempts = item.attempts + 1;
    const isExhausted = nextAttempts >= item.maxAttempts;
    const delayMinutes = getBackoffMinutes(nextAttempts);
    const nextRetryAt = isExhausted ? null : new Date(Date.now() + delayMinutes * 60 * 1000);

    await prisma.$transaction([
      prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status: "FAILED",
          attempts: nextAttempts,
          nextRetryAt,
          error: result.error || "Send failed",
          updatedAt: now,
        },
      }),
      prisma.emailLog.create({
        data: {
          recipient: item.recipient,
          subject: item.subject || rendered.subject,
          templateId: item.templateId,
          status: "FAILED",
          error: result.error || "Send failed",
          metadataJson: item.payloadJson || item.metadataJson,
          sentAt: now,
        },
      }),
    ]);
    return { success: false, error: result.error };
  }
}

/**
 * Pull and process pending batch from EmailQueue
 */
export async function processEmailQueueBatch(
  batchSize: number = 25
): Promise<QueueProcessingSummary> {
  const summary: QueueProcessingSummary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    suppressed: 0,
    errors: [],
  };

  const now = new Date();

  // Find items ready for sending
  const items = await prisma.emailQueue.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: prisma.emailQueue.fields.maxAttempts },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: [
      { priority: "asc" }, // HIGH precedes NORMAL precedes LOW
      { createdAt: "asc" },
    ],
    take: batchSize,
  });

  for (const item of items) {
    summary.processed++;
    try {
      const res = await processQueueItem(item.id);
      if (res.success) {
        summary.succeeded++;
      } else {
        if (res.error?.includes("Suppressed")) {
          summary.suppressed++;
        } else {
          summary.failed++;
        }
        summary.errors.push({ id: item.id, error: res.error || "Unknown error" });
      }
    } catch (err: any) {
      summary.failed++;
      summary.errors.push({ id: item.id, error: err?.message || String(err) });
    }
  }

  return summary;
}
