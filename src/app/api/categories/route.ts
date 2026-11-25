import { NextResponse } from "next/server";
import { getCachedCategories } from "@/lib/db/queries";

export const revalidate = 300;

export async function GET() {
  try {
    const categories = await getCachedCategories();
    return NextResponse.json(
      { categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
