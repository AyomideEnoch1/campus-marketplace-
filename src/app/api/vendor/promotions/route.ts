export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  calculatePromoPrice,
  getPromoLiveStatus,
  syncPromotionsLifecycle,
} from "@/lib/promotions";

const createPromoSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive("Discount value must be greater than 0"),
  startAt: z.string().datetime("Valid ISO start date is required"),
  endAt: z.string().datetime("Valid ISO end date is required"),
  label: z.string().max(50, "Label must be 50 characters or less").optional().nullable(),
});

// GET /api/vendor/promotions - List vendor's promotions
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.vendorProfile) {
      return NextResponse.json({ error: "Unauthorized: Vendor access required" }, { status: 401 });
    }

    const vendorId = session.vendorProfile.id;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // SCHEDULED, ACTIVE, EXPIRED, ALL

    // Sync database lifecycle statuses on read
    await syncPromotionsLifecycle(vendorId);

    const now = new Date();

    const promotions = await prisma.promotion.findMany({
      where: {
        vendorId,
        ...(statusFilter && statusFilter !== "ALL"
          ? { status: statusFilter as any }
          : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: { take: 1, orderBy: { position: "asc" } },
            stock: true,
            status: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { endAt: "desc" }],
    });

    // Format with live status and time calculations
    const formatted = promotions.map((p) => {
      const liveStatus = getPromoLiveStatus(p, now);
      const calc = calculatePromoPrice(p.product.price, p.discountType as any, p.discountValue);

      return {
        ...p,
        liveStatus,
        effectivePromoPrice: calc.promoPrice,
        discountPercent: calc.discountPercent,
        savingsAmount: calc.savingsAmount,
        serverNow: now.toISOString(),
      };
    });

    return NextResponse.json({ promotions: formatted });
  } catch (err: any) {
    console.error("GET /api/vendor/promotions error:", err);
    return NextResponse.json({ error: "Failed to fetch promotions" }, { status: 500 });
  }
}

// POST /api/vendor/promotions - Create a new promotion
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.vendorProfile) {
      return NextResponse.json({ error: "Unauthorized: Vendor access required" }, { status: 401 });
    }

    const vendorId = session.vendorProfile.id;
    const body = await request.json();
    const parsed = createPromoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid promotion data" },
        { status: 400 }
      );
    }

    const { productId, discountType, discountValue, startAt, endAt, label } = parsed.data;

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const now = new Date();

    // 1. Validate dates
    if (endDate.getTime() <= startDate.getTime()) {
      return NextResponse.json(
        { error: "Promotion end time must be after start time." },
        { status: 400 }
      );
    }

    if (endDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: "Promotion end time must be in the future." },
        { status: 400 }
      );
    }

    // 2. Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, vendorId: true, price: true, title: true },
    });

    if (!product || product.vendorId !== vendorId) {
      return NextResponse.json(
        { error: "Product not found or not owned by your vendor account." },
        { status: 404 }
      );
    }

    // 3. Price and Discount Validation
    if (discountType === "PERCENTAGE" && (discountValue <= 0 || discountValue >= 100)) {
      return NextResponse.json(
        { error: "Percentage discount must be between 1% and 99%." },
        { status: 400 }
      );
    }

    if (discountType === "FIXED" && (discountValue <= 0 || discountValue >= product.price)) {
      return NextResponse.json(
        { error: `Fixed discount must be greater than ₦0 and less than product price (₦${product.price.toLocaleString()}).` },
        { status: 400 }
      );
    }

    const { promoPrice } = calculatePromoPrice(product.price, discountType, discountValue);

    if (promoPrice <= 0 || promoPrice >= product.price) {
      return NextResponse.json(
        { error: "Calculated promo price must be greater than ₦0 and less than original price." },
        { status: 400 }
      );
    }

    // 4. Overlapping Promo Check: Ensure only one active/scheduled promo per product
    const existingConflict = await prisma.promotion.findFirst({
      where: {
        productId,
        status: { in: ["ACTIVE", "SCHEDULED"] },
        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
    });

    if (existingConflict) {
      return NextResponse.json(
        {
          error:
            "This product already has an active or scheduled promotion during the selected time period.",
        },
        { status: 409 }
      );
    }

    // 5. Initial status
    const initialStatus = startDate.getTime() <= now.getTime() ? "ACTIVE" : "SCHEDULED";

    const newPromotion = await prisma.promotion.create({
      data: {
        productId,
        vendorId,
        discountType,
        discountValue,
        promoPrice,
        startAt: startDate,
        endAt: endDate,
        label: label?.trim() || null,
        status: initialStatus,
      },
      include: {
        product: {
          select: { id: true, title: true, slug: true, price: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Promotion successfully ${initialStatus === "ACTIVE" ? "started" : "scheduled"}!`,
      promotion: newPromotion,
    });
  } catch (err: any) {
    console.error("POST /api/vendor/promotions error:", err);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
