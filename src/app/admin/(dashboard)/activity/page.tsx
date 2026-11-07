import { prisma } from "@/lib/prisma";
import { Activity, Clock, User, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
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

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVED") || action.includes("PUBLISHED") || action.includes("CREATED")) {
      return (
        <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
          {action}
        </Badge>
      );
    }
    if (action.includes("REJECTED") || action.includes("DELETED") || action.includes("FLAGGED")) {
      return (
        <Badge className="bg-red-950 text-red-400 border border-red-800 text-[10px]">
          {action}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-950 text-blue-400 border border-blue-800 text-[10px]">
        {action}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          System Activity & Audit Trail
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Cryptographically recorded timeline of administrative actions, moderation events, and state changes.
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/60 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Audit Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let metadataObj: any = null;
                  try {
                    if (log.metadataJson) {
                      metadataObj = JSON.parse(log.metadataJson);
                    }
                  } catch (e) {
                    metadataObj = log.metadataJson;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>

                      <td className="py-3 px-4">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="text-[10px] text-neutral-500 font-mono ml-1.5">
                            #{log.entityId.slice(-6)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                            {log.user ? log.user.fullName[0] : "S"}
                          </div>
                          <div>
                            <p className="font-bold text-white text-[11px]">
                              {log.user ? log.user.fullName : "System Agent"}
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              {log.user ? log.user.role : "AUTOMATED"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 max-w-xs truncate">
                        {metadataObj ? (
                          typeof metadataObj === "object" ? (
                            JSON.stringify(metadataObj)
                          ) : (
                            String(metadataObj)
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
