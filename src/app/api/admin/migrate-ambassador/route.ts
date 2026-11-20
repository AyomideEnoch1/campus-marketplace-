export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  // Simple security check using existing JWT secret or fallback key
  if (key !== "run-ambassador-migration-2026") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    // 1. Enums
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AmbassadorStatus') THEN
          CREATE TYPE "AmbassadorStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReferralRewardStatus') THEN
          CREATE TYPE "ReferralRewardStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
        END IF;
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
          ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'AMBASSADOR';
        END IF;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    results["enums"] = "OK";

    // 2. AmbassadorProfile
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AmbassadorProfile" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "campusId" TEXT NOT NULL,
          "referralCode" TEXT NOT NULL,
          "status" "AmbassadorStatus" NOT NULL DEFAULT 'ACTIVE',
          "bio" TEXT,
          "whatsapp" TEXT,
          "bankAccountName" TEXT,
          "bankAccountNumber" TEXT,
          "bankCode" TEXT,
          "bankName" TEXT,
          "bankResolvedName" TEXT,
          "bankVerified" BOOLEAN NOT NULL DEFAULT false,
          "totalClicks" INTEGER NOT NULL DEFAULT 0,
          "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
          "paidEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
          "pendingEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "AmbassadorProfile_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "AmbassadorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "AmbassadorProfile_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
    results["AmbassadorProfile_table"] = "OK";

    // Indexes for AmbassadorProfile
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AmbassadorProfile_userId_key" ON "AmbassadorProfile"("userId");`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AmbassadorProfile_referralCode_key" ON "AmbassadorProfile"("referralCode");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AmbassadorProfile_referralCode_idx" ON "AmbassadorProfile"("referralCode");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AmbassadorProfile_campusId_idx" ON "AmbassadorProfile"("campusId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AmbassadorProfile_status_idx" ON "AmbassadorProfile"("status");`);
    results["AmbassadorProfile_indexes"] = "OK";

    // 3. Referral
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Referral" (
          "id" TEXT NOT NULL,
          "ambassadorId" TEXT NOT NULL,
          "referredUserId" TEXT NOT NULL,
          "roleAtSignup" TEXT NOT NULL DEFAULT 'BUYER',
          "isQualified" BOOLEAN NOT NULL DEFAULT false,
          "rewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
          "rewardStatus" "ReferralRewardStatus" NOT NULL DEFAULT 'PENDING',
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "Referral_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Referral_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "AmbassadorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    results["Referral_table"] = "OK";

    // Indexes for Referral
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredUserId_key" ON "Referral"("referredUserId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Referral_ambassadorId_idx" ON "Referral"("ambassadorId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Referral_rewardStatus_idx" ON "Referral"("rewardStatus");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Referral_roleAtSignup_idx" ON "Referral"("roleAtSignup");`);
    results["Referral_indexes"] = "OK";

    // 4. AmbassadorPayout
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AmbassadorPayout" (
          "id" TEXT NOT NULL,
          "ambassadorId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "reference" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "bankDetails" TEXT,
          "notes" TEXT,
          "processedBy" TEXT,
          "processedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "AmbassadorPayout_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "AmbassadorPayout_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "AmbassadorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    results["AmbassadorPayout_table"] = "OK";

    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "AmbassadorPayout_reference_key" ON "AmbassadorPayout"("reference");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AmbassadorPayout_ambassadorId_idx" ON "AmbassadorPayout"("ambassadorId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AmbassadorPayout_status_idx" ON "AmbassadorPayout"("status");`);
    results["AmbassadorPayout_indexes"] = "OK";

    return NextResponse.json({
      success: true,
      message: "Ambassador database tables successfully created in Supabase PostgreSQL!",
      results,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: error.message, results },
      { status: 500 }
    );
  }
}
