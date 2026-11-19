import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const validateCartActionSchema = z.object({
  action: z.enum(["add", "update", "remove", "validate_all"]),
  productId: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateCartActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { action, productId, quantity = 1, items } = parsed.data;

    if (action === "remove") {
      return NextResponse.json({ success: true, valid: true });
    }

    if (action === "add" || action === "update") {
      if (!productId) {
        return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          vendor: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              status: true,
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product no longer exists in marketplace." },
          { status: 404 }
        );
      }

      if (product.status !== "PUBLISHED") {
        return NextResponse.json(
          { error: `"${product.title}" is currently not available for purchase.` },
          { status: 400 }
        );
      }

      if (product.stock <= 0) {
        return NextResponse.json(
          { error: `"${product.title}" is out of stock.` },
          { status: 400 }
        );
      }

      if (quantity > product.stock) {
        return NextResponse.json(
          {
            error: `Only ${product.stock} unit(s) of "${product.title}" available in stock.`,
            availableStock: product.stock,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        valid: true,
        product: {
          id: product.id,
          title: product.title,
          price: product.price,
          stock: product.stock,
          status: product.status,
        },
      });
    }

    if (action === "validate_all" && items) {
      const productIds = items.map((i) => i.id);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          title: true,
          price: true,
          stock: true,
          status: true,
        },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));
      const adjustments: Array<{ id: string; title: string; reason: string; adjustedQuantity?: number }> = [];

      for (const item of items) {
        const dbProduct = productMap.get(item.id);
        if (!dbProduct || dbProduct.status !== "PUBLISHED") {
          adjustments.push({
            id: item.id,
            title: dbProduct?.title || "Unknown item",
            reason: "Product is no longer available",
            adjustedQuantity: 0,
          });
        } else if (item.quantity > dbProduct.stock) {
          adjustments.push({
            id: item.id,
            title: dbProduct.title,
            reason: `Stock limited to ${dbProduct.stock}`,
            adjustedQuantity: Math.max(0, dbProduct.stock),
          });
        }
      }

      return NextResponse.json({
        success: true,
        valid: adjustments.length === 0,
        adjustments,
      });
    }

    return NextResponse.json({ success: true, valid: true });
  } catch (error: any) {
    console.error("Cart validation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate cart item" },
      { status: 500 }
    );
  }
}
