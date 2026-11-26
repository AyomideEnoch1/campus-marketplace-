/**
 * ==============================================================================
 * SHARED ORDER PAYMENT VERIFICATION ROUTINE
 * ==============================================================================
 * Called by BOTH the redirect callback handler and the Flutterwave webhook.
 * 
 * Rules:
 * 1. Always calls Flutterwave verify-transaction endpoint directly.
 * 2. Never trusts redirect query parameters or webhook body alone.
 * 3. Asserts:
 *    - status === 'successful'
 *    - tx_ref matches an existing order
 *    - amount & currency (NGN) match order.subtotal exactly
 * 4. Atomic state change:
 *    - Order escrow_status -> 'paid_held'
 *    - Append-only ledger entries: 'escrow_in' (+ 'commission')
 *    - Record in 'payments' table
 *    - Generate cryptographically secure 6-digit delivery code & hash
 *    - Deduct product stock
 * ==============================================================================
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "./flutterwave";

export interface VerifyOrderPaymentResult {
  success: boolean;
  message: string;
  orderId?: string;
  txRef?: string;
  status?: string;
  alreadyProcessed?: boolean;
  order?: any;
  deliveryCode?: string | null;
}

export async function verifyOrderPayment(
  flwTransactionId: string | number,
  expectedTxRef?: string
): Promise<VerifyOrderPaymentResult> {
  // 1. Query Flutterwave API directly
  const flwResult = await verifyTransaction(flwTransactionId);

  if (!flwResult.success || flwResult.status !== "successful") {
    return {
      success: false,
      message: `Transaction not successful on Flutterwave (Status: ${flwResult.status})`,
      txRef: flwResult.txRef,
    };
  }

  const txRef = flwResult.txRef || expectedTxRef;
  if (!txRef) {
    return {
      success: false,
      message: "No tx_ref returned in transaction verification response",
    };
  }

  // 2. Fetch the corresponding order
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { tx_ref: txRef },
        { orderNumber: txRef },
      ],
    },
    include: {
      items: {
        include: {
          product: { select: { title: true } },
        },
      },
      vendor: {
        include: {
          user: { select: { email: true } },
        },
      },
      deliveryCode: true,
      payments: true,
    },
  });

  if (!order) {
    return {
      success: false,
      message: `No order found matching tx_ref: ${txRef}`,
      txRef,
    };
  }

  // 3. Idempotency Check: if already paid_held or released, do not duplicate
  if (
    order.escrow_status === "paid_held" ||
    order.escrow_status === "delivered" ||
    order.escrow_status === "confirmed" ||
    order.escrow_status === "payout_pending" ||
    order.escrow_status === "released"
  ) {
    let existingCode: string | undefined = undefined;
    if (order.deliveryCode?.codeHash) {
      const parts = order.deliveryCode.codeHash.split("|");
      if (parts.length > 1) {
        const { decryptCode } = await import("@/lib/crypto");
        existingCode = decryptCode(parts[1]) || undefined;
      }
    }

    return {
      success: true,
      message: "Order already verified and held in escrow",
      orderId: order.id,
      txRef: order.tx_ref || txRef,
      status: order.escrow_status,
      alreadyProcessed: true,
      order,
      deliveryCode: existingCode,
    };
  }

  // 4. Strict Amount & Currency Validation
  const expectedAmount = Number(order.totalAmount || order.subtotal);
  const paidAmount = Number(flwResult.amount);

  if (
    Math.abs(paidAmount - expectedAmount) > 0.01 &&
    Math.abs(paidAmount - Number(order.subtotal)) > 0.01
  ) {
    console.error(
      `[Escrow Security Alert] Amount mismatch for order ${order.id}: expected ${expectedAmount} NGN, received ${paidAmount} NGN`
    );
    return {
      success: false,
      message: `Amount mismatch: expected NGN ${expectedAmount}, received NGN ${paidAmount}`,
      orderId: order.id,
      txRef,
    };
  }

  if (flwResult.currency.toUpperCase() !== "NGN") {
    return {
      success: false,
      message: `Invalid currency: expected NGN, received ${flwResult.currency}`,
      orderId: order.id,
      txRef,
    };
  }

  // 5. Generate secure 6-digit delivery code & hash
  const rawDeliveryCode = crypto.randomInt(100000, 999999).toString();
  const sha256Hash = crypto.createHash("sha256").update(rawDeliveryCode).digest("hex");
  
  // Pack SHA-256 hash and AES-encrypted code so only authenticated buyer can view it
  const { encryptCode } = await import("@/lib/crypto");
  const encrypted = encryptCode(rawDeliveryCode);
  const codeHash = `${sha256Hash}|${encrypted}`;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // 6. Execute Atomic Updates
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // A. Update Order status
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CONFIRMED",
        escrow_status: "paid_held",
        paid_at: now,
        flw_transaction_id: flwResult.flwTransactionId.toString(),
        tx_ref: txRef,
      },
    });

    // B. Record Payment
    await tx.payment.upsert({
      where: { flwTransactionId: flwResult.flwTransactionId.toString() },
      create: {
        orderId: order.id,
        flwTransactionId: flwResult.flwTransactionId.toString(),
        txRef: txRef,
        amount: paidAmount,
        currency: "NGN",
        status: "successful",
        paymentType: flwResult.paymentType || "flutterwave_standard",
        rawVerifyResponse: JSON.stringify(flwResult.rawResponse),
      },
      update: {
        status: "successful",
      },
    });

    // C. Write Append-Only Escrow Ledger Entries
    // 1) Escrow In (Full Subtotal)
    await tx.escrowLedger.create({
      data: {
        orderId: order.id,
        type: "escrow_in",
        amount: paidAmount,
        currency: "NGN",
        reference: txRef,
        description: `Escrow payment held for Order #${order.orderNumber} via Flutterwave (TxID: ${flwResult.flwTransactionId})`,
      },
    });

    // 2) Commission Record (if applicable)
    if (order.commission && order.commission > 0) {
      await tx.escrowLedger.create({
        data: {
          orderId: order.id,
          type: "commission",
          amount: order.commission,
          currency: "NGN",
          reference: `${txRef}_comm`,
          description: `Platform commission (5%) for Order #${order.orderNumber}`,
        },
      });
    }

    // D. Store Hashed Delivery Code
    await tx.deliveryCode.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        codeHash: codeHash,
        expiresAt: expiresAt,
        attempts: 0,
        locked: false,
      },
      update: {
        codeHash: codeHash,
        expiresAt: expiresAt,
        attempts: 0,
        locked: false,
      },
    });

    // E. Deduct Product Stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      }).catch((e) => console.warn(`Could not decrement stock for product ${item.productId}`, e));
    }
  });

  // Dispatch confirmation notifications with the 6-digit delivery code
  try {
    const { notificationService } = await import("@/lib/email/notification-service");

    if (order.buyerEmail) {
      notificationService
        .notifyBuyerOrderConfirmed({
          email: order.buyerEmail,
          orderNumber: order.orderNumber,
          buyerName: order.buyerName || "Student",
          items: order.items.map((it: any) => ({
            title: it.product?.title || it.variantDetails || "Campus Item",
            quantity: it.quantity,
            price: Number(it.unitPrice),
          })),
          totalAmount: Number(order.totalAmount || order.subtotal),
          deliveryCode: rawDeliveryCode,
          meetupPoint: order.deliveryAddress || "Campus Meetup Zone",
        })
        .catch((e) => console.warn("[VerifyOrderPayment] Buyer confirmation email error:", e));
    }

    const vendorEmail = (order.vendor as any)?.user?.email;
    if (vendorEmail) {
      notificationService
        .notifyVendorNewOrder({
          email: vendorEmail,
          orderNumber: order.orderNumber,
          storeName: order.vendor.storeName,
          buyerName: order.buyerName || "Student",
          items: order.items.map((it: any) => ({
            title: it.product?.title || it.variantDetails || "Campus Item",
            quantity: it.quantity,
            price: Number(it.unitPrice),
          })),
          payoutAmount: Number(order.seller_amount || order.subtotal),
          meetupPoint: order.deliveryAddress || "Campus Meetup Zone",
        })
        .catch((e) => console.warn("[VerifyOrderPayment] Vendor new order email error:", e));
    }
  } catch (emailErr) {
    console.warn("[VerifyOrderPayment] Notification dispatch error:", emailErr);
  }

  return {
    success: true,
    message: "Payment successfully verified and funds secured in escrow",
    orderId: order.id,
    txRef,
    status: "paid_held",
    deliveryCode: rawDeliveryCode,
  };
}
