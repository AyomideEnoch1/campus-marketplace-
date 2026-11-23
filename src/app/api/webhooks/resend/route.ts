export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Resend Webhook Ingestion for Bounces & Spam Complaints
 * Automatically records bad addresses into EmailSuppression
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.type; // e.g. "email.bounced", "email.complained", "email.delivered"
    const data = body?.data;

    if (!eventType || !data) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const recipient = Array.isArray(data.to) ? data.to[0] : data.to;
    const normalizedEmail = recipient?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ received: true });
    }

    // 1. Handle Bounce
    if (eventType === "email.bounced") {
      const bounceReason = data.bounce?.message || data.bounce?.type || "Hard bounce";
      await prisma.emailSuppression.upsert({
        where: { email: normalizedEmail },
        create: {
          email: normalizedEmail,
          reason: "BOUNCE",
          details: bounceReason,
        },
        update: {
          reason: "BOUNCE",
          details: bounceReason,
        },
      });

      // Update log record if messageId matches
      if (data.email_id) {
        await prisma.emailLog.updateMany({
          where: { providerMessageId: data.email_id },
          data: { status: "BOUNCED", error: bounceReason },
        });
      }

      console.warn(`[Resend Webhook: Bounced] ${normalizedEmail} added to suppression.`);
    }

    // 2. Handle Spam Complaint
    if (eventType === "email.complained") {
      await prisma.emailSuppression.upsert({
        where: { email: normalizedEmail },
        create: {
          email: normalizedEmail,
          reason: "COMPLAINT",
          details: "Spam complaint reported by recipient mail provider",
        },
        update: {
          reason: "COMPLAINT",
          details: "Spam complaint reported by recipient mail provider",
        },
      });

      console.warn(`[Resend Webhook: Complained] ${normalizedEmail} added to suppression.`);
    }

    // 3. Handle Delivery confirmation
    if (eventType === "email.delivered" && data.email_id) {
      await prisma.emailLog.updateMany({
        where: { providerMessageId: data.email_id },
        data: { status: "SENT" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Resend Webhook Error]:", error);
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 500 });
  }
}
