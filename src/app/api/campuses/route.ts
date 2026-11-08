import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campuses = await prisma.campus.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        settings: true,
        safeMeetupPoints: {
          where: { active: true },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            vendors: {
              where: {
                sellerType: "guest",
                status: "APPROVED",
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ campuses });
  } catch (error: any) {
    return NextResponse.json({ campuses: [] });
  }
}
