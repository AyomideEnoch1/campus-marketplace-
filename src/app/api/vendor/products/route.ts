import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { qualifyVendorReferral } from "@/lib/referral";
import { computeVendorEntitlements } from "@/lib/vendor-entitlements";
import { calculatePromoPrice } from "@/lib/promotions";

export const dynamic = "force-dynamic";

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be greater than 0"),
  comparePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(1),
  categoryId: z.string().min(1, "Please select a category"),
  condition: z.enum(["NEW", "USED_LIKE_NEW", "USED_GOOD", "USED_FAIR"]).default("NEW"),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).default("PUBLISHED"),
  tags: z.string().optional().nullable(),
  model3dUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  images: z.array(z.string().min(1, "Image path cannot be empty")).min(1, "Please provide at least one product image"),
  variants: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        priceAdjustment: z.number().default(0),
        stock: z.number().int().default(0),
      })
    )
    .optional(),
  promo: z
    .object({
      enabled: z.boolean().default(false),
      discountType: z.enum(["PERCENTAGE", "FIXED"]),
      discountValue: z.number().positive(),
      startAt: z.string(),
      endAt: z.string(),
      label: z.string().max(50).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export async function GET() {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { position: "asc" } },
        category: true,
        variants: true,
        promotions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { orderItems: true, productReviews: true } },
      },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireVendor();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: session.id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid product details" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check vendor entitlements (access state + admin approval gate + listing limit)
    const entitlements = computeVendorEntitlements(vendor);

    // 1. Check configurable product listing limit
    const totalListings = await prisma.product.count({
      where: { vendorId: vendor.id },
    });

    if (totalListings >= entitlements.maxListings) {
      return NextResponse.json(
        {
          error: `You have reached your product listing limit of ${entitlements.maxListings} items. Please remove or archive existing listings to add new products.`,
        },
        { status: 403 }
      );
    }

    // 2. Gate 5: Both gates must pass to publish products to the public shop
    let productStatus = data.status || "PUBLISHED";
    if (productStatus === "PUBLISHED" && !entitlements.canPublish) {
      if (!entitlements.hasAccess) {
        return NextResponse.json(
          {
            error:
              "Active vendor access required to publish products. Please activate your access via payment or founding coupon code.",
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

    // GUEST VENDOR SAFEGUARD: Tier 1 guest vendors capped at max 3 listings
    if (vendor.sellerType === "guest" && (vendor.verificationTier || 1) < 2) {
      const activeListingsCount = await prisma.product.count({
        where: { vendorId: vendor.id },
      });
      if (activeListingsCount >= 3) {
        return NextResponse.json(
          {
            error:
              "Tier 1 Guest Vendors are limited to 3 listings. Please upload your Government ID and selfie for Tier 2 verification to unlock unlimited campus listings.",
          },
          { status: 403 }
        );
      }
    }

    // RESTRICTED CATEGORIES SAFEGUARD FOR GUESTS
    // (Food, Cosmetics/Beauty, Electronics require extra details)
    if (vendor.sellerType === "guest") {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      const catSlug = category?.slug || "";
      const isRestricted =
        catSlug.includes("food") ||
        catSlug.includes("grocer") ||
        catSlug.includes("beauty") ||
        catSlug.includes("personal-care") ||
        catSlug.includes("electronic");

      if (isRestricted) {
        const textContent = `${data.description} ${data.tags || ""}`.toLowerCase();
        // Check for required details (serial number, warranty, NAFDAC, or batch expiry)
        const hasExtraDetails =
          textContent.includes("nafdac") ||
          textContent.includes("serial") ||
          textContent.includes("batch") ||
          textContent.includes("expir") ||
          textContent.includes("warranty") ||
          textContent.includes("original") ||
          textContent.includes("spec");

        if (!hasExtraDetails) {
          return NextResponse.json(
            {
              error: `Guest listings in "${category?.name || "restricted category"}" require extra regulatory details (e.g. NAFDAC number for packaged food/cosmetics, or serial number / warranty / authenticity details for electronics). Please include these in your description.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Generate unique slug
    const baseSlug = slugify(data.title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}-${Math.random().toString(36).substring(2, 6)}`;
      counter++;
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: data.categoryId,
          title: data.title,
          slug: uniqueSlug,
          description: data.description,
          price: data.price,
          comparePrice: data.comparePrice || null,
          stock: data.stock,
          condition: data.condition as any,
          status: productStatus as any,
          tags: data.tags || null,
          model3dUrl: data.model3dUrl || null,
          videoUrl: data.videoUrl || null,
        },
      });

      // Insert images
      for (let i = 0; i < data.images.length; i++) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: data.images[i],
            position: i,
            altText: `${product.title} - photo ${i + 1}`,
          },
        });
      }

      // Insert variants if any
      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          await tx.productVariant.create({
            data: {
              productId: product.id,
              name: variant.name,
              value: variant.value,
              priceAdjustment: variant.priceAdjustment || 0,
              stock: variant.stock || 0,
            },
          });
        }
      }

      // Create promotion if specified
      if (data.promo && data.promo.enabled) {
        const start = new Date(data.promo.startAt);
        const end = new Date(data.promo.endAt);
        const now = new Date();

        if (end.getTime() > start.getTime()) {
          const calc = calculatePromoPrice(data.price, data.promo.discountType, data.promo.discountValue);
          const initialStatus = start.getTime() <= now.getTime() ? "ACTIVE" : "SCHEDULED";

          await tx.promotion.create({
            data: {
              productId: product.id,
              vendorId: vendor.id,
              discountType: data.promo.discountType,
              discountValue: data.promo.discountValue,
              promoPrice: calc.promoPrice,
              startAt: start,
              endAt: end,
              label: data.promo.label?.trim() || null,
              status: initialStatus,
            },
          });
        }
      }

      return product;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    try {
      revalidatePath(`/store/${vendor.slug}`);
      revalidatePath("/shop");
      revalidatePath("/dashboard/products");
    } catch (e) {}

    // Qualify ambassador vendor referral if this was their first product listing
    try {
      await qualifyVendorReferral(session.id);
    } catch (qErr) {
      console.error("Qualify referral error:", qErr);
    }

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
