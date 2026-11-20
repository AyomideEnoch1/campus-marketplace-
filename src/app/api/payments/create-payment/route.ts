import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPayment } from "@/lib/payments/flutterwave";
import { evaluateEscrowOrder, getPlatformSettings } from "@/lib/payments/escrow-rules";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    const {
      items,
      meetupPointId,
      deliveryAddress,
      deliveryMethod = "MEETUP",
      notes,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerWantsDirect, // Only considered if canToggle === true
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    const userEmail = session?.email || buyerEmail;
    const userName = (session as any)?.fullName || buyerName || "Campus Student";
    const userPhone = (session as any)?.phone || buyerPhone || "08000000000";

    if (!userEmail) {
      return NextResponse.json({ error: "Buyer email is required for checkout" }, { status: 400 });
    }

    // 1. Fetch real products server-side from database (NEVER TRUST CLIENT PRICES)
    const productIds = items.map((i: any) => i.productId || i.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "PUBLISHED" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        vendor: {
          select: {
            id: true,
            userId: true,
            storeName: true,
            sellerType: true,
            verificationTier: true,
            isTrustedSeller: true,
            strikesCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (dbProducts.length === 0) {
      return NextResponse.json({ error: "None of the selected products were found" }, { status: 404 });
    }

    const primaryVendor = dbProducts[0].vendor;
    const vendorId = primaryVendor.id;

    // Disallow vendors from buying their own items
    if (session?.id && primaryVendor.userId === session.id) {
      return NextResponse.json(
        { error: "You cannot purchase products from your own store." },
        { status: 400 }
      );
    }

    let subtotal = 0;
    const orderItemsData: any[] = [];
    const evaluatedItems: any[] = [];

    for (const item of items) {
      const prod = dbProducts.find((p) => p.id === (item.productId || item.id));
      if (!prod || prod.vendorId !== vendorId) continue;

      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Number(prod.price);
      subtotal += unitPrice * qty;

      orderItemsData.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: unitPrice,
        variantDetails: item.variantDetails || null,
      });

      evaluatedItems.push({
        categoryId: prod.category?.id,
        categorySlug: prod.category?.slug,
        categoryName: prod.category?.name,
      });
    }

    if (orderItemsData.length === 0 || subtotal <= 0) {
      return NextResponse.json({ error: "Invalid items or zero subtotal" }, { status: 400 });
    }

    // 2. Fetch Buyer History for Forced Escrow Checks
    let completedOrdersCount = 0;
    if (session?.id) {
      completedOrdersCount = await prisma.order.count({
        where: {
          buyerId: session.id,
          escrow_status: { in: ["confirmed", "released"] },
        },
      });
    }

    // 3. Evaluate Value-Based Escrow Rules Server-Side
    const settings = await getPlatformSettings();
    const quote = await evaluateEscrowOrder({
      subtotal,
      buyerWantsDirect: Boolean(buyerWantsDirect),
      seller: primaryVendor,
      buyer: session ? { id: session.id, completedOrdersCount } : null,
      items: evaluatedItems,
      settings,
    });

    // 4. Enforce Direct Order Limits & Pattern Flagging
    if (quote.escrow_mode === "direct") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Check daily direct orders for buyer
      if (session?.id) {
        const buyerDirectToday = await prisma.order.count({
          where: {
            buyerId: session.id,
            escrow_mode: "direct",
            createdAt: { gte: startOfDay },
          },
        });
        if (buyerDirectToday >= settings.direct_orders_per_day_buyer_limit) {
          throw new Error("Daily limit for direct orders reached. Please use Escrow Protection.");
        }
      }

      // Check daily direct orders for seller
      const sellerDirectToday = await prisma.order.count({
        where: {
          vendorId: primaryVendor.id,
          escrow_mode: "direct",
          createdAt: { gte: startOfDay },
        },
      });
      if (sellerDirectToday >= settings.direct_orders_per_day_seller_limit) {
        throw new Error("Vendor has reached daily limit for direct orders. Escrow is required.");
      }

      // Check suspicious repeated sub-₦5k pattern
      if (session?.id && subtotal < 5000) {
        const recentSub5k = await prisma.order.count({
          where: {
            buyerId: session.id,
            vendorId: primaryVendor.id,
            subtotal: { lt: 5000 },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (recentSub5k >= 3) {
          // Flag suspicious pattern
          await prisma.activityLog.create({
            data: {
              userId: session.id,
              action: "SUSPICIOUS_DIRECT_PATTERN_FLAG",
              entityType: "ORDER",
              metadataJson: JSON.stringify({
                reason: "Multiple sub-₦5,000 direct orders between same buyer and seller within 24h",
                vendorId: primaryVendor.id,
                buyerId: session.id,
                recentCount: recentSub5k,
              }),
            },
          }).catch(() => {});
        }
      }
    }

    // 5. Generate unique order references
    const orderNumber = `CT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txRef = `ct_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/checkout/confirm?tx_ref=${txRef}`;

    // 6. Create Order with snapshot of settings & computed escrow_mode
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId: session?.id || session?.userId || null,
        buyerName: userName,
        buyerEmail: userEmail,
        buyerPhone: userPhone,
        deliveryAddress: deliveryAddress || "Campus Safe Meetup Point",
        deliveryMethod,
        meetupPointId: meetupPointId || null,
        vendorId,
        status: "PENDING",
        escrow_status: "pending",
        escrow_mode: quote.escrow_mode,
        escrow_forced_reason: quote.forcedReason,
        fee_amount: quote.feeAmountNaira,
        fee_percent: quote.feePercent,
        fee_payer: quote.feePayer,
        settings_snapshot: JSON.stringify(quote.settingsSnapshot),
        totalAmount: quote.buyerTotalNaira,
        subtotal: quote.subtotalNaira,
        commission: quote.platformCommissionNaira,
        seller_amount: quote.sellerAmountNaira,
        currency: "NGN",
        tx_ref: txRef,
        notes: notes || null,
        items: {
          create: orderItemsData,
        },
      },
    });

    // 7. Initiate Flutterwave Checkout for buyerTotal
    const payment = await createPayment({
      txRef,
      amount: quote.buyerTotalNaira,
      currency: "NGN",
      redirectUrl,
      customer: {
        email: userEmail,
        name: userName,
        phoneNumber: userPhone,
      },
      customizations: {
        title: `CampusTrade ${quote.escrow_mode === "escrow" ? "Escrow" : "Direct"}: #${orderNumber}`,
        description: quote.escrow_mode === "escrow"
          ? "Payment held safely in escrow until you inspect and accept items."
          : "Direct campus checkout: vendor is paid upon payment verification.",
        logo: `${appUrl}/icons/icon-192x192.png`,
      },
      meta: {
        order_id: order.id,
        order_number: orderNumber,
        buyer_id: session?.id || null,
        seller_id: vendorId,
        escrow_mode: quote.escrow_mode,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      txRef,
      paymentLink: payment.paymentLink,
      escrow_mode: quote.escrow_mode,
      forcedReason: quote.forcedReason,
      subtotal: quote.subtotalNaira,
      feeAmount: quote.feeAmountNaira,
      totalToPay: quote.buyerTotalNaira,
      sellerAmount: quote.sellerAmountNaira,
      commission: quote.platformCommissionNaira,
    });
  } catch (error: any) {
    console.error("[Create Payment Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
