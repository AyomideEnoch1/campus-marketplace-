import { NextResponse } from "next/server";
import { getCachedCampuses } from "@/lib/db/queries";

export const revalidate = 300;

export async function GET() {
  try {
    const campuses = await getCachedCampuses();
    return NextResponse.json(
      { campuses },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json({ campuses: [] });
  }
}
