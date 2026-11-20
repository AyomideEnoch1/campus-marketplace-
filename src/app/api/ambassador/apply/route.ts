import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to become an ambassador" }, { status: 401 });
    }

    const body = await request.json();
    const { campusId, preferredCode, whatsapp, bio } = body;

    if (!campusId) {
      return NextResponse.json({ error: "Campus is required" }, { status: 400 });
    }

    // Check if user is already an ambassador
    const existing = await prisma.ambassadorProfile.findUnique({
      where: { userId: session.id },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        ambassador: existing,
        message: "You are already a campus ambassador",
      });
    }

    // Generate unique referral code if not specified or format preferred
    let baseCode = (preferredCode || session.fullName.split(" ")[0] || "AMB")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);

    if (baseCode.length < 3) baseCode = "CAMPUS";

    let finalCode = baseCode;
    let counter = 1;
    while (await prisma.ambassadorProfile.findUnique({ where: { referralCode: finalCode } })) {
      finalCode = `${baseCode}${counter}`;
      counter++;
    }

    const ambassador = await prisma.ambassadorProfile.create({
      data: {
        userId: session.id,
        campusId,
        referralCode: finalCode,
        whatsapp: whatsapp || null,
        bio: bio || null,
        status: "ACTIVE",
      },
      include: {
        campus: true,
      },
    });

    return NextResponse.json({
      success: true,
      ambassador,
      message: `Ambassador profile created! Your referral code is ${finalCode}`,
    });
  } catch (err: any) {
    console.error("POST /api/ambassador/apply error:", err);
    return NextResponse.json({ error: err.message || "Failed to create ambassador profile" }, { status: 500 });
  }
}
