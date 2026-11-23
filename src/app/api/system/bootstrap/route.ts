export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");

    if (secret !== "promotion1-superadmin-setup-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = "ayomidenoch15@gmail.com".toLowerCase().trim();
    const password = "Promotion1...";
    const passwordHash = await hashPassword(password);

    // Ensure the Postgres Role enum contains SUPERADMIN
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';`);
    } catch (e: any) {
      console.log("Enum update notice:", e?.message);
    }

    // Check if SUPERADMIN record already exists
    const existingSuperadmin = await prisma.user.findFirst({
      where: { email, role: "SUPERADMIN" },
    });

    let user;
    if (existingSuperadmin) {
      user = await prisma.user.update({
        where: { id: existingSuperadmin.id },
        data: {
          passwordHash,
          fullName: "Ayomide Enoch",
          emailVerified: new Date(),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          fullName: "Ayomide Enoch",
          role: "SUPERADMIN",
          passwordHash,
          emailVerified: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Super admin registered successfully!",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err: any) {
    console.error("Bootstrap error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to bootstrap superadmin" },
      { status: 500 }
    );
  }
}
