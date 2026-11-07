import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Platform Configuration & Settings
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Configure site brand parameters, contact channels, vendor onboarding policy, and commission.
        </p>
      </div>

      <SettingsForm initialSettings={settingsMap} />
    </div>
  );
}
