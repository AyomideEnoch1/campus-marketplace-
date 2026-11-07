import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth";

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

    // Enforce approval check on status
    let newStatus = data.status;
    if (vendor.status !== "APPROVED" && newStatus === "PUBLISHED") {
      newStatus = "DRAFT";
    }

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

      return p;
    });

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

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
