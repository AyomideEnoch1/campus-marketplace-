export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculatePromoPrice } from "@/lib/promotions";

const updatePromoSchema = z.object({
  action: z.enum(["update", "end_early"]).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  label: z.string().max(50).optional().nullable(),
});

// PATCH /api/vendor/promotions/[id] - Edit or End Early
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.vendorProfile) {
      return NextResponse.json({ error: "Unauthorized: Vendor access required" }, { status: 401 });
    }

    const vendorId = session.vendorProfile.id;
    const promoId = params.id;

    // Verify ownership
    const promo = await prisma.promotion.findUnique({
      where: { id: promoId },
      include: {
        product: { select: { id: true, price: true, vendorId: true } },
      },
    });

    if (!promo || promo.vendorId !== vendorId) {
      return NextResponse.json(
        { error: "Promotion not found or not owned by you" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updatePromoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const { action, discountType, discountValue, startAt, endAt, label } = parsed.data;
    const now = new Date();

    // 1. Action: End Early
    if (action === "end_early") {
      const updated = await prisma.promotion.update({
        where: { id: promoId },
        data: {
          endAt: now,
          status: "EXPIRED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Promotion ended early successfully.",
        promotion: updated,
      });
    }

    // 2. Action: Edit Promotion
    const newDiscountType = discountType || (promo.discountType as any);
    const newDiscountValue = discountValue !== undefined ? discountValue : promo.discountValue;
    const newStart = startAt ? new Date(startAt) : promo.startAt;
    const newEnd = endAt ? new Date(endAt) : promo.endAt;

    if (newEnd.getTime() <= newStart.getTime()) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }

    const { promoPrice } = calculatePromoPrice(
      promo.product.price,
      newDiscountType,
      newDiscountValue
    );

    if (promoPrice <= 0 || promoPrice >= promo.product.price) {
      return NextResponse.json(
        { error: "Promo price must be greater than ₦0 and less than original price." },
        { status: 400 }
      );
    }

    // Overlap conflict check against other promotions for the same product
    const conflict = await prisma.promotion.findFirst({
      where: {
        productId: promo.productId,
        id: { not: promoId },
        status: { in: ["ACTIVE", "SCHEDULED"] },
        startAt: { lt: newEnd },
        endAt: { gt: newStart },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Another promotion for this product overlaps with the new dates." },
        { status: 409 }
      );
    }

    const newStatus =
      newEnd.getTime() <= now.getTime()
        ? "EXPIRED"
        : newStart.getTime() <= now.getTime()
        ? "ACTIVE"
        : "SCHEDULED";

    const updated = await prisma.promotion.update({
      where: { id: promoId },
      data: {
        discountType: newDiscountType,
        discountValue: newDiscountValue,
        promoPrice,
        startAt: newStart,
        endAt: newEnd,
        label: label !== undefined ? label?.trim() || null : promo.label,
        status: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Promotion updated successfully.",
      promotion: updated,
    });
  } catch (err: any) {
    console.error("PATCH /api/vendor/promotions/[id] error:", err);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

// DELETE /api/vendor/promotions/[id] - Delete / Cancel Promotion
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || !session.vendorProfile) {
      return NextResponse.json({ error: "Unauthorized: Vendor access required" }, { status: 401 });
    }

    const vendorId = session.vendorProfile.id;
    const promoId = params.id;

    const promo = await prisma.promotion.findUnique({
      where: { id: promoId },
      select: { id: true, vendorId: true },
    });

    if (!promo || promo.vendorId !== vendorId) {
      return NextResponse.json(
        { error: "Promotion not found or not owned by you" },
        { status: 404 }
      );
    }

    await prisma.promotion.delete({
      where: { id: promoId },
    });

    return NextResponse.json({
      success: true,
      message: "Promotion deleted successfully.",
    });
  } catch (err: any) {
    console.error("DELETE /api/vendor/promotions/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
