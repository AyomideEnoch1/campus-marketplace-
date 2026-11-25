import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { computeVendorEntitlements, isVendorPaymentRestrictionEnabled } from "@/lib/vendor-entitlements";
import { calculatePromoPrice } from "@/lib/promotions";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  condition: z.enum(["NEW", "USED_LIKE_NEW", "USED_GOOD", "USED_FAIR"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).optional(),
  tags: z.string().optional().nullable(),
  model3dUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  images: z.array(z.string().min(1, "Image path cannot be empty")).optional(),
  promo: z
    .object({
      id: z.string().optional(),
      enabled: z.boolean(),
      discountType: z.enum(["PERCENTAGE", "FIXED"]),
      discountValue: z.number().positive(),
      startAt: z.string(),
      endAt: z.string(),
      label: z.string().max(50).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: { id: params.id, vendorId: vendor.id },
      include: {
        images: { orderBy: { position: "asc" } },
        category: true,
        variants: true,
        promotions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: { id: params.id, vendorId: vendor.id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check entitlements if attempting to publish
    if (data.status === "PUBLISHED") {
      const paymentRestrictionEnabled = await isVendorPaymentRestrictionEnabled();
      const entitlements = computeVendorEntitlements(vendor, { paymentRestrictionEnabled });
      if (!entitlements.canPublish) {
        if (!entitlements.hasAccess) {
          return NextResponse.json(
            {
              error:
                "Active vendor access required to publish products. Please activate your access via payment or coupon code.",
            },
            { status: 403 }
          );
        }
        if (!entitlements.isApproved) {
          return NextResponse.json(
            {
              error:
                "Your vendor account is pending administrator approval. Products can only be published to the public shop after approval.",
            },
            { status: 403 }
          );
        }
      }
    }

    // Honor status
    const newStatus = data.status;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: params.id },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.description ? { description: data.description } : {}),
          ...(data.price !== undefined ? { price: data.price } : {}),
          ...(data.comparePrice !== undefined ? { comparePrice: data.comparePrice } : {}),
          ...(data.stock !== undefined ? { stock: data.stock } : {}),
          ...(data.categoryId ? { categoryId: data.categoryId } : {}),
          ...(data.condition ? { condition: data.condition as any } : {}),
          ...(newStatus ? { status: newStatus as any } : {}),
          ...(data.tags !== undefined ? { tags: data.tags } : {}),
          ...(data.model3dUrl !== undefined ? { model3dUrl: data.model3dUrl } : {}),
          ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
        },
      });

      // Update images if provided
      if (data.images && data.images.length > 0) {
        await tx.productImage.deleteMany({ where: { productId: p.id } });
        for (let i = 0; i < data.images.length; i++) {
          await tx.productImage.create({
            data: {
              productId: p.id,
              url: data.images[i],
              position: i,
              altText: `${p.title} view ${i + 1}`,
            },
          });
        }
      }

      // Handle Promo Updates
      const currentBasePrice = data.price !== undefined ? data.price : product.price;

      if (data.promo) {
        if (data.promo.enabled) {
          const startAt = new Date(data.promo.startAt);
          const endAt = new Date(data.promo.endAt);

          if (endAt <= startAt) {
            throw new Error("Promo end date must be after start date");
          }

          const { promoPrice } = calculatePromoPrice(
            currentBasePrice,
            data.promo.discountType,
            data.promo.discountValue
          );

          if (promoPrice <= 0 || promoPrice >= currentBasePrice) {
            throw new Error("Promo price must be greater than ₦0 and less than regular price");
          }

          const now = new Date();
          const promoStatus = startAt > now ? "SCHEDULED" : "ACTIVE";

          // If updating an existing promo
          if (data.promo.id) {
            await tx.promotion.update({
              where: { id: data.promo.id },
              data: {
                discountType: data.promo.discountType,
                discountValue: data.promo.discountValue,
                promoPrice,
                startAt,
                endAt,
                label: data.promo.label?.trim() || null,
                status: promoStatus,
              },
            });
          } else {
            // Cancel any prior active/scheduled promos for this product
            await tx.promotion.updateMany({
              where: {
                productId: p.id,
                status: { in: ["ACTIVE", "SCHEDULED"] },
              },
              data: { status: "CANCELLED" },
            });

            await tx.promotion.create({
              data: {
                productId: p.id,
                vendorId: vendor.id,
                discountType: data.promo.discountType,
                discountValue: data.promo.discountValue,
                promoPrice,
                startAt,
                endAt,
                label: data.promo.label?.trim() || null,
                status: promoStatus,
              },
            });
          }
        } else {
          // Promo explicitly disabled / ended
          await tx.promotion.updateMany({
            where: {
              productId: p.id,
              status: { in: ["ACTIVE", "SCHEDULED"] },
            },
            data: { status: "CANCELLED" },
          });
        }
      } else if (data.price !== undefined && data.price !== product.price) {
        // Base price changed, but promo was not explicitly passed in payload:
        // Update promoPrice on any active/scheduled promos for this product
        const activePromos = await tx.promotion.findMany({
          where: {
            productId: p.id,
            status: { in: ["ACTIVE", "SCHEDULED"] },
          },
        });

        for (const pr of activePromos) {
          const { promoPrice } = calculatePromoPrice(
            data.price,
            pr.discountType as any,
            pr.discountValue
          );
          await tx.promotion.update({
            where: { id: pr.id },
            data: { promoPrice },
          });
        }
      }

      return p;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    try {
      revalidatePath(`/store/${vendor.slug}`);
      revalidatePath("/shop");
      revalidatePath("/dashboard/products");
    } catch (e) {}

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: { id: params.id, vendorId: vendor.id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    try {
      revalidatePath(`/store/${vendor.slug}`);
      revalidatePath("/shop");
      revalidatePath("/dashboard/products");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
