import { prisma } from "@/lib/prisma";
import { PagesCmsEditor } from "./PagesCmsEditor";

export const dynamic = "force-dynamic";

export default async function AdminCmsPagesPage() {
  const pages = await prisma.page.findMany({
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Static Content Pages (CMS)
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Manage legal, safety, policy, and informational pages across the platform.
        </p>
      </div>

      <PagesCmsEditor initialPages={pages as any} />
    </div>
  );
}
