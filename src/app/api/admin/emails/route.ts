export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const search = req.nextUrl.searchParams.get("search")?.trim().toLowerCase() || "";
    const status = req.nextUrl.searchParams.get("status") || "";
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || "1"));
    const limit = Math.max(10, Math.min(100, Number(req.nextUrl.searchParams.get("limit") || "30")));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { templateId: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    // Parallel fetch: logs, queue counts, suppression count
    const [logs, totalLogs, queueStats, suppressions] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.emailLog.count({ where }),
      prisma.emailQueue.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.emailSuppression.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const formattedQueueStats = {
      pending: queueStats.find((s) => s.status === "PENDING")?._count.status || 0,
      processing: queueStats.find((s) => s.status === "PROCESSING")?._count.status || 0,
      sent: queueStats.find((s) => s.status === "SENT")?._count.status || 0,
      failed: queueStats.find((s) => s.status === "FAILED")?._count.status || 0,
    };

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
      },
      queueStats: formattedQueueStats,
      suppressions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch email logs" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
