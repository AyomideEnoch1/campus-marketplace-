import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`view:${ip}:${params.id}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ success: true, throttled: true });
    }

    await prisma.product.update({
      where: { id: params.id },
      data: { viewsCount: { increment: 1 } },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
