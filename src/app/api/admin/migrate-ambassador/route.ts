export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  return NextResponse.json({ message: "Ambassador database migration has already completed successfully." });
}
