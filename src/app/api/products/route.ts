import { NextResponse } from "next/server";
import { queryPaginatedProducts } from "@/lib/db/queries";
import { clampLimit, clampPage, MAX_PAGE_SIZE } from "@/lib/db/selects";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`api:products:${ip}`, 90, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = clampLimit(searchParams.get("limit"), 20, MAX_PAGE_SIZE);
    const offsetParam = searchParams.get("offset");
    const page = clampPage(searchParams.get("page"));

    const result = await queryPaginatedProducts({
      q: searchParams.get("q"),
      category: searchParams.get("category"),
      campus: searchParams.get("campus"),
      condition: searchParams.get("condition"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      sort: searchParams.get("sort"),
      vendor: searchParams.get("vendor"),
      sellerType: searchParams.get("sellerType"),
      limit,
      page,
      offset: offsetParam !== null ? Math.max(0, parseInt(offsetParam, 10) || 0) : undefined,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
