import { prisma } from "@/lib/prisma";
import { HomepageCmsEditor } from "./HomepageCmsEditor";

export const dynamic = "force-dynamic";

export default async function AdminCmsHomepagePage() {
  const settings = await prisma.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Homepage CMS & Hero Editor
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Manage announcements, dynamic hero text, and promotional banners.
        </p>
      </div>

      <HomepageCmsEditor initialSettings={settingsMap} />
    </div>
  );
}
