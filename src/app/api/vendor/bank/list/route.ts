import { NextResponse } from "next/server";
import { listBanks, DEFAULT_NIGERIAN_BANKS } from "@/lib/payments/flutterwave";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json({ success: true, banks: banks && banks.length > 0 ? banks : DEFAULT_NIGERIAN_BANKS });
  } catch (error: any) {
    console.error("[List Banks Error]:", error);
    return NextResponse.json({ success: true, banks: DEFAULT_NIGERIAN_BANKS });
  }
}
