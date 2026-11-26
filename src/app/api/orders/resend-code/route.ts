import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decryptCode, encryptCode } from "@/lib/crypto";
import { notificationService } from "@/lib/email/notification-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleResend(req);
}

export async function POST(req: NextRequest) {
  return handleResend(req);
}

async function handleResend(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);

    const queryOrderNumber = searchParams.get("orderNumber");
    const queryOrderId = searchParams.get("orderId");
    const queryEmail = searchParams.get("email");

    // 1. Find the target order
    let order: any = null;

    if (queryOrderNumber) {
      order = await prisma.order.findUnique({
        where: { orderNumber: queryOrderNumber },
        include: {
          deliveryCode: true,
          items: { include: { product: { select: { title: true } } } },
          vendor: { select: { storeName: true } },
        },
      });
    } else if (queryOrderId) {
      order = await prisma.order.findUnique({
        where: { id: queryOrderId },
        include: {
          deliveryCode: true,
          items: { include: { product: { select: { title: true } } } },
          vendor: { select: { storeName: true } },
        },
      });
    } else if (session?.id) {
      // Find the most recent order for this user
      order = await prisma.order.findFirst({
        where: {
          OR: [{ buyerId: session.id }, { buyerEmail: session.email }],
        },
        orderBy: { createdAt: "desc" },
        include: {
          deliveryCode: true,
          items: { include: { product: { select: { title: true } } } },
          vendor: { select: { storeName: true } },
        },
      });
    }

    // Fallback: If still not found and caller is admin (or no order found yet), find the latest order overall
    if (!order) {
      order = await prisma.order.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          deliveryCode: true,
          items: { include: { product: { select: { title: true } } } },
          vendor: { select: { storeName: true } },
        },
      });
    }

    if (!order) {
      return NextResponse.json({ error: "No orders found in database" }, { status: 404 });
    }

    // 2. Retrieve or generate the delivery code
    let code: string | null = null;

    if (order.deliveryCode?.codeHash) {
      const parts = order.deliveryCode.codeHash.split("|");
      if (parts.length > 1) {
        code = decryptCode(parts[1]);
      }
    }

    // If code could not be decrypted or did not exist, generate fresh code
    if (!code) {
      code = crypto.randomInt(100000, 999999).toString();
      const sha256Hash = crypto.createHash("sha256").update(code).digest("hex");
      const encrypted = encryptCode(code);
      const codeHash = `${sha256Hash}|${encrypted}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CONFIRMED",
            escrow_status: "paid_held",
            paid_at: order.paid_at || new Date(),
          },
        }),
        prisma.deliveryCode.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            codeHash,
            expiresAt,
            attempts: 0,
            locked: false,
          },
          update: {
            codeHash,
            expiresAt,
            attempts: 0,
            locked: false,
          },
        }),
      ]);
    }

    // 3. Dispatch confirmation email
    let emailSent = false;
    const recipientEmail = queryEmail || order.buyerEmail || session?.email;

    if (recipientEmail) {
      try {
        await notificationService.notifyBuyerOrderConfirmed({
          email: recipientEmail,
          orderNumber: order.orderNumber,
          buyerName: order.buyerName || "Student",
          items: order.items.map((it: any) => ({
            title: it.product?.title || it.variantDetails || "Campus Item",
            quantity: it.quantity,
            price: Number(it.unitPrice),
          })),
          totalAmount: Number(order.totalAmount || order.subtotal),
          deliveryCode: code,
          meetupPoint: order.deliveryAddress || "Campus Meetup Zone",
        });
        emailSent = true;
      } catch (e: any) {
        console.warn("[ResendCode] Email dispatch error:", e?.message || e);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerEmail: recipientEmail,
      deliveryCode: code,
      totalAmount: order.totalAmount,
      escrow_status: order.escrow_status,
      emailSent,
      message: `Activation code retrieved successfully! ${emailSent ? `Email sent to ${recipientEmail}.` : ""}`,
    });
  } catch (error: any) {
    console.error("[Resend Code API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve activation code" },
      { status: 500 }
    );
  }
}
