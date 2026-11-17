import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ savedItems: [] });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            images: { orderBy: { position: "asc" } },
            category: { select: { name: true, slug: true } },
            vendor: {
              select: {
                id: true,
                storeName: true,
                slug: true,
                campus: { select: { name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    const savedItems = favorites
      .filter((f) => f.product && f.product.status === "PUBLISHED")
      .map((f) => ({
        id: f.product.id,
        title: f.product.title,
        slug: f.product.slug,
        price: f.product.price,
        comparePrice: f.product.comparePrice,
        image:
          f.product.images?.[0]?.url ||
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
        condition: f.product.condition,
        categoryName: f.product.category?.name,
        vendorName: f.product.vendor?.storeName,
        vendorCampus: f.product.vendor?.campus?.name,
      }));

    return NextResponse.json({ savedItems });
  } catch (error: any) {
    console.error("GET /api/wishlist error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saved items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const session = await getSession();

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });

    if (!product || product.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Product is no longer available" },
        { status: 404 }
      );
    }

    if (session) {
      await prisma.favorite.upsert({
        where: {
          userId_productId: {
            userId: session.id,
            productId,
          },
        },
        create: {
          userId: session.id,
          productId,
        },
        update: {},
      });
    }

    return NextResponse.json({ success: true, saved: true, productId });
  } catch (error: any) {
    console.error("POST /api/wishlist error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const session = await getSession();

    if (session) {
      await prisma.favorite.deleteMany({
        where: {
          userId: session.id,
          productId,
        },
      });
    }

    return NextResponse.json({ success: true, saved: false, productId });
  } catch (error: any) {
    console.error("DELETE /api/wishlist error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove item" },
      { status: 500 }
    );
  }
}
