import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { evaluateEscrowOrder } from "@/lib/payments/escrow-rules";

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
      },
    });

    if (dbProducts.length === 0) {
      return NextResponse.json({ error: "Products not found" }, { status: 404 });
    }

    const primaryVendor = dbProducts[0].vendor;
    const vendorId = primaryVendor.id;

    let subtotal = 0;
    const evaluatedItems: any[] = [];

    for (const item of items) {
      const prod = dbProducts.find((p) => p.id === (item.productId || item.id));
      if (!prod || prod.vendorId !== vendorId) continue;
      const qty = Math.max(1, Number(item.quantity) || 1);
      subtotal += Number(prod.price) * qty;

      evaluatedItems.push({
        categoryId: prod.category?.id,
        categorySlug: prod.category?.slug,
        categoryName: prod.category?.name,
      });
    }

    // Buyer completed order count for new-buyer rule
    let completedOrdersCount = 0;
    if (session?.id) {
      completedOrdersCount = await prisma.order.count({
        where: {
          buyerId: session.id,
          escrow_status: { in: ["confirmed", "released"] },
        },
      });
    }

    const quote = await evaluateEscrowOrder({
      subtotal,
      buyerWantsDirect: Boolean(buyerWantsDirect),
      seller: primaryVendor,
      buyer: session ? { id: session.id, completedOrdersCount } : null,
      items: evaluatedItems,
    });

    return NextResponse.json({
      success: true,
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
