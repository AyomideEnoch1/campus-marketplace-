import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string {
  let envUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

  // When deployed to Vercel (or AWS Lambda serverless), the root deployment filesystem is read-only.
  // SQLite writes require a writable directory for WAL, journal, and db mutations.
  // We copy the seeded sqlite db to /tmp on lambda cold-start.
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless && (!envUrl || envUrl.startsWith("file:"))) {
    const tmpDbPath = path.join("/tmp", "dev.db");

    try {
      if (!fs.existsSync(tmpDbPath)) {
        const candidates = [
          path.join(process.cwd(), "prisma", "dev.db"),
          path.join(process.cwd(), "dev.db"),
          path.join(__dirname, "..", "..", "..", "prisma", "dev.db"),
          path.join(__dirname, "..", "..", "prisma", "dev.db"),
          path.join(__dirname, "prisma", "dev.db"),
        ];

        let copied = false;
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            try {
              fs.copyFileSync(candidate, tmpDbPath);
              copied = true;
              break;
            } catch (err) {
              console.warn(`Failed to copy from ${candidate}:`, err);
            }
          }
        }

        if (!copied) {
          console.warn("Could not find source dev.db to copy to /tmp; will initialize an empty file");
          fs.writeFileSync(tmpDbPath, "");
        }
      }

      if (fs.existsSync(tmpDbPath)) {
        envUrl = `file:${tmpDbPath}`;
        process.env.DATABASE_URL = envUrl;
      }
    } catch (e) {
      console.error("Failed to setup writable SQLite database in /tmp:", e);
    }
  }

  return envUrl;
}

const resolvedDatabaseUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
