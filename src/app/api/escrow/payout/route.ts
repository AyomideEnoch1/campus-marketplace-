import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkOrderPayoutStatus, releaseEscrowPayout } from "@/lib/escrow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const status = await checkOrderPayoutStatus(orderId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to check escrow payout status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    // Only admin or automated job can trigger release early
    const isAdmin = session.role === "ADMIN";
    const updated = await releaseEscrowPayout(orderId, isAdmin ? session.id : undefined);

    return NextResponse.json({
      success: true,
      message: "Escrow payout successfully released",
      order: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to release escrow payout" },
      { status: 400 }
    );
  }
}
