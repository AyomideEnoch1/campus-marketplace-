export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService, getSuperAdminEmail } from "@/lib/email/notification-service";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const urlSecret = req.nextUrl.searchParams.get("secret");
    if (urlSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized cron caller" }, { status: 401 });
    }
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1. Total Orders & Volume in last 24h
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: twentyFourHoursAgo } },
    select: { totalAmount: true },
  });

  const totalOrders = orders.length;
  const totalVolume = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // 2. New Users in last 24h
  const newUsersCount = await prisma.user.count({
    where: {
      createdAt: { gte: twentyFourHoursAgo },
      role: "BUYER",
    },
  });

  // 3. New Vendors in last 24h
  const newVendorsCount = await prisma.vendorProfile.count({
    where: { createdAt: { gte: twentyFourHoursAgo } },
  });

  // 4. Open Disputes
  const pendingDisputesCount = await prisma.dispute.count({
    where: { status: "open" },
  });

  const adminEmail = await getSuperAdminEmail();
  const dateStr = new Date().toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  await notificationService.enqueue({
    recipient: adminEmail,
    templateId: "admin_daily_digest",
    priority: "LOW",
    payload: {
      date: dateStr,
      totalOrders,
      totalVolume,
      newUsersCount,
      newVendorsCount,
      pendingDisputesCount,
    },
  });

  return NextResponse.json({
    success: true,
    date: dateStr,
    stats: {
      totalOrders,
      totalVolume,
      newUsersCount,
      newVendorsCount,
      pendingDisputesCount,
    },
  });
}
