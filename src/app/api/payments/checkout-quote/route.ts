import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { evaluateEscrowOrder, checkOrderSplittingRisk } from "@/lib/payments/escrow-rules";
import { getEffectiveProductPrice } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { items, buyerWantsDirect } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items specified" }, { status: 400 });
    }

    const productIds = items.map((i: any) => i.productId || i.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        vendor: {
          select: {
            id: true,
            storeName: true,
            sellerType: true,
            verificationTier: true,
            isTrustedSeller: true,
            strikesCount: true,
            createdAt: true,
          },
        },
        promotions: {
          where: {
            status: "ACTIVE",
            startAt: { lte: new Date() },
            endAt: { gt: new Date() },
          },
          take: 1,
        },
      },
    });

    if (dbProducts.length === 0) {
      return NextResponse.json({ error: "Products not found" }, { status: 404 });
    }

    const primaryVendor = dbProducts[0].vendor;
    const vendorId = primaryVendor.id;

    let subtotal = 0;
    const evaluatedItems: any[] = [];
    let priceAdjustedNotice: string | null = null;
    const serverNow = new Date();

    for (const item of items) {
      const prod = dbProducts.find((p) => p.id === (item.productId || item.id));
      if (!prod || prod.vendorId !== vendorId) continue;
      const qty = Math.max(1, Number(item.quantity) || 1);

      // Server-side promo price calculation
      const { effectivePrice, originalPrice, hasActivePromo } = getEffectiveProductPrice(prod, serverNow);
      subtotal += effectivePrice * qty;

      // Detect if user had a lower promo price in their cart that has expired
      const clientPrice = Number(item.price);
      if (!isNaN(clientPrice) && clientPrice < effectivePrice) {
        priceAdjustedNotice = "A promotion on one or more items in your cart has expired. Prices have been updated.";
      }

      evaluatedItems.push({
        categoryId: prod.category?.id,
        categorySlug: prod.category?.slug,
        categoryName: prod.category?.name,
      });
    }

    // Buyer completed order count for new-buyer rule & splitting risk check
    let completedOrdersCount = 0;
    let splittingRisk = {
      isSplittingSuspected: false,
      reason: null as string | null,
    };

    if (session?.id) {
      try {
        completedOrdersCount = await prisma.order.count({
          where: {
            buyerId: session.id,
            OR: [
              { escrow_status: { in: ["confirmed", "released", "released_to_seller"] } },
              { status: "DELIVERED" },
            ],
          },
        });
      } catch {
        completedOrdersCount = await prisma.order.count({
          where: {
            buyerId: session.id,
            status: "DELIVERED",
          },
        }).catch(() => 0);
      }

      const risk = await checkOrderSplittingRisk(
        session.id,
        primaryVendor.id,
        Math.round(subtotal * 100)
      );
      splittingRisk.isSplittingSuspected = risk.isSplittingSuspected;
      splittingRisk.reason = risk.reason;
    }

    const quote = await evaluateEscrowOrder({
      subtotal,
      buyerWantsDirect: Boolean(buyerWantsDirect),
      seller: primaryVendor,
      buyer: session ? { id: session.id, completedOrdersCount } : null,
      items: evaluatedItems,
      isSplittingSuspected: splittingRisk.isSplittingSuspected,
      splittingReason: splittingRisk.reason,
    });

    return NextResponse.json({
      success: true,
      priceAdjustedNotice,
      quote: {
        escrow_mode: quote.escrow_mode,
        canToggle: quote.canToggle,
        isForced: quote.isForced,
        forcedReason: quote.forcedReason,
        thresholdCategory: quote.thresholdCategory,
        subtotal: quote.subtotalNaira,
        feeAmount: quote.feeAmountNaira,
        feePercent: quote.feePercent,
        feePayer: quote.feePayer,
        buyerTotal: quote.buyerTotalNaira,
        sellerAmount: quote.sellerAmountNaira,
        commission: quote.platformCommissionNaira,
        kobo: {
          subtotal: quote.subtotalKobo,
          fee: quote.feeAmountKobo,
          buyerTotal: quote.buyerTotalKobo,
        },
      },
    });
  } catch (error: any) {
    console.error("[Checkout Quote Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate quote" }, { status: 500 });
  }
}
