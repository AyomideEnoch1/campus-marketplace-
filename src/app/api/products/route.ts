import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category");
    const campus = searchParams.get("campus");
    const condition = searchParams.get("condition");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort");
    const vendor = searchParams.get("vendor");
    const sellerType = searchParams.get("sellerType");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const where: any = {
      status: "PUBLISHED",
    };

    if (category) {
      const matchedCategory = await prisma.category.findUnique({
        where: { slug: category },
        include: { children: true },
      });

      if (matchedCategory && matchedCategory.children?.length > 0) {
        where.category = {
          slug: { in: [matchedCategory.slug, ...matchedCategory.children.map((c) => c.slug)] },
        };
      } else {
        where.category = {
          slug: category,
        };
      }
    }

    if (campus) {
      where.vendor = {
        campus: {
          slug: campus,
        },
      };
    }

    if (vendor) {
      where.vendor = {
        ...(where.vendor || {}),
        slug: vendor,
      };
    }

    if (sellerType && (sellerType === "student" || sellerType === "guest")) {
      where.vendor = {
        ...(where.vendor || {}),
        sellerType,
      };
    }

    if (condition) {
      where.condition = condition;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Determine sorting
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    if (sort === "price-desc") orderBy = { price: "desc" };
    if (sort === "popular") orderBy = { viewsCount: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          images: { orderBy: { position: "asc" } },
          category: { select: { id: true, name: true, slug: true } },
          vendor: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              whatsapp: true,
              sellerType: true,
              isRegisteredBusiness: true,
              isTrustedSeller: true,
              verificationTier: true,
              campus: { select: { id: true, name: true, slug: true, city: true } },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
