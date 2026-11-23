export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminEmailsClient } from "./AdminEmailsClient";

export default async function AdminEmailsPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    redirect("/admin/login");
  }

  // Preload initial queue stats and latest 30 logs
  const [logs, totalLogs, queueStats, suppressions] = await Promise.all([
    prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.emailLog.count(),
    prisma.emailQueue.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.emailSuppression.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const initialStats = {
    pending: queueStats.find((s) => s.status === "PENDING")?._count.status || 0,
    processing: queueStats.find((s) => s.status === "PROCESSING")?._count.status || 0,
    sent: queueStats.find((s) => s.status === "SENT")?._count.status || 0,
    failed: queueStats.find((s) => s.status === "FAILED")?._count.status || 0,
  };

  return (
    <div className="space-y-6">
      <AdminEmailsClient
        initialLogs={logs as any}
        totalLogs={totalLogs}
        initialStats={initialStats}
        initialSuppressions={suppressions as any}
        adminEmail={session.email}
      />
    </div>
  );
}
