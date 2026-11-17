import { NextResponse } from "next/server";
import { listBanks } from "@/lib/payments/flutterwave";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json({ success: true, banks });
  } catch (error: any) {
    console.error("[List Banks Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch bank list" }, { status: 500 });
  }
}
