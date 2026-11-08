export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            "hero_badge",
            "hero_title",
            "hero_subtitle",
            "announcement_bar",
            "flash_sale_title",
            "flash_sale_subtitle",
          ],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json(settingsMap);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const allowedKeys = [
      "hero_badge",
      "hero_title",
      "hero_subtitle",
      "announcement_bar",
      "flash_sale_title",
      "flash_sale_subtitle",
    ];

    const updates = Object.entries(body).filter(([key]) =>
      allowedKeys.includes(key)
    );

    for (const [key, value] of updates) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          description: `Homepage CMS setting: ${key}`,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "HOMEPAGE_CMS_UPDATED",
        entityType: "SiteSetting",
        metadataJson: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save CMS settings" },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
