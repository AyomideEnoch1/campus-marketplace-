import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhook } from "@/lib/payments/flutterwave";
import { verifyOrderPayment } from "@/lib/payments/verify-order-payment";
import { notificationService } from "@/lib/email/notification-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Webhook Secret Hash
    const isValid = verifyWebhook(req.headers);
    if (!isValid) {
      console.warn("[Webhook Security Alert] Invalid or missing verif-hash header received");
      return NextResponse.json({ error: "Unauthorized webhook caller" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Empty or invalid JSON body" }, { status: 400 });
    }

    const eventType = body["event"] || body["event.type"] || body["eventType"] || "charge.completed";
    const eventData = body.data || body;
    const eventId = String(eventData.id || eventData.reference || body.id || `evt_${Date.now()}`);

    // 2. Idempotency Check via webhook_events table
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      return NextResponse.json({ message: "Event already processed (idempotent)" }, { status: 200 });
    }

    // Log incoming event to webhook_events
    await prisma.webhookEvent.create({
      data: {
        provider: "flutterwave",
        eventId,
        eventType,
        payload: JSON.stringify(body),
        status: "processed",
      },
    }).catch((e) => console.warn("[Webhook Event Log warning]", e));

    // 3. Handle Events
    switch (eventType) {
      case "charge.completed": {
        const transactionId = eventData.id;
        const txRef = eventData.tx_ref;

        if (transactionId) {
          // Always re-verify directly through Flutterwave verify-transaction API
          const verification = await verifyOrderPayment(transactionId, txRef);
          console.log(`[Webhook charge.completed] Transaction #${transactionId}:`, verification.message);
        }
        break;
      }

      case "transfer.completed": {
        const reference = eventData.reference;
        const transferId = String(eventData.id || "");

        if (reference) {
          const payout = await prisma.payout.findUnique({
            where: { reference },
            include: {
              order: {
                include: {
                  vendor: {
                    include: {
                      user: { select: { email: true } },
                    },
                  },
                },
              },
            },
          });

          if (payout) {
            const now = new Date();
            await prisma.$transaction([
              prisma.payout.update({
                where: { id: payout.id },
                data: {
                  status: "successful",
                  flwTransferId: transferId,
                  completedAt: now,
                },
              }),
              prisma.order.update({
                where: { id: payout.orderId },
                data: {
                  escrow_status: "released",
                  released_at: now,
                },
              }),
            ]);

            // Notify vendor that payout was deposited
            if (payout.order?.vendor?.user?.email) {
              notificationService.notifyVendorPayoutStatus({
                email: payout.order.vendor.user.email,
                orderNumber: payout.order.orderNumber,
                storeName: payout.order.vendor.storeName,
                amount: payout.amount,
                status: "PAID",
              }).catch(() => {});
            }

            console.log(`[Webhook transfer.completed] Payout #${payout.id} marked successful, order released.`);
          }
        }
        break;
      }

      case "transfer.failed": {
        const reference = eventData.reference;
        if (reference) {
          const payout = await prisma.payout.findUnique({
            where: { reference },
            include: {
              order: {
                include: {
                  vendor: {
                    include: {
                      user: { select: { email: true } },
                    },
                  },
                },
              },
            },
          });
          if (payout) {
            // Schedule retry with exponential backoff if attempts < 5
            const nextAttempts = payout.attempts + 1;
            const nextRetryDelayHours = Math.min(24, Math.pow(2, nextAttempts));
            const nextRetryAt = new Date(Date.now() + nextRetryDelayHours * 60 * 60 * 1000);
            const failureReason = eventData.complete_message || "Transfer failed by bank network";

            await prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: "failed",
                failureReason,
                attempts: nextAttempts,
                nextRetryAt: nextAttempts < 5 ? nextRetryAt : null,
              },
            });

            // Notify Super Admin and Vendor
            notificationService.notifyAdminPayoutFailed({
              orderNumber: payout.order?.orderNumber || "Escrow",
              storeName: payout.order?.vendor?.storeName || "Vendor",
              amount: payout.amount,
              failureReason,
            }).catch(() => {});

            if (payout.order?.vendor?.user?.email) {
              notificationService.notifyVendorPayoutStatus({
                email: payout.order.vendor.user.email,
                orderNumber: payout.order?.orderNumber || "Escrow",
                storeName: payout.order?.vendor?.storeName || "Vendor",
                amount: payout.amount,
                status: "FAILED",
                errorMessage: failureReason,
              }).catch(() => {});
            }

            console.log(`[Webhook transfer.failed] Payout #${payout.id} failed, retry scheduled for ${nextRetryAt}`);
          }
        }
        break;
      }

      case "transfer.reversed": {
        const reference = eventData.reference;
        if (reference) {
          const payout = await prisma.payout.findUnique({ where: { reference } });
          if (payout) {
            await prisma.$transaction([
              prisma.payout.update({
                where: { id: payout.id },
                data: {
                  status: "reversed",
                  failureReason: "Transfer reversed by recipient bank",
                },
              }),
              prisma.escrowLedger.create({
                data: {
                  orderId: payout.orderId,
                  type: "adjustment",
                  amount: payout.amount,
                  currency: "NGN",
                  reference: `${reference}_reversed`,
                  description: `Reversal adjustment for failed payout transfer #${reference}`,
                },
              }),
            ]);
            console.log(`[Webhook transfer.reversed] Payout #${payout.id} reversed, ledger adjusted.`);
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ status: "success", received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook Processing Error]:", error);
    return NextResponse.json({ error: error.message || "Webhook processing error" }, { status: 500 });
  }
}
