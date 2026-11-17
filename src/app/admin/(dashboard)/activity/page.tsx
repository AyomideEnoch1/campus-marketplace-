import { prisma } from "@/lib/prisma";
import { AdminActivityTable, ActivityLogItem } from "./AdminActivityTable";
import { Activity, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  let logs: ActivityLogItem[] = [];

  try {
    const rawLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 150,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logs = rawLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadataJson: log.metadataJson,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
      user: log.user
        ? {
            fullName: log.user.fullName,
            email: log.user.email,
            role: log.user.role,
          }
        : null,
    }));
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              System Activity & Audit Trail
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Audit Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time audit log of vendor moderations, role updates, product changes, and administrative operations
          </p>
        </div>
      </div>

      <AdminActivityTable initialLogs={logs} />
    </div>
  );
}
