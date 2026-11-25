import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string {
  // Isolate Vercel Preview/Staging deployments from production Supabase if configured.
  const isPreview = process.env.VERCEL_ENV === "preview";
  let envUrl =
    (isPreview && process.env.PREVIEW_DATABASE_URL) ||
    (isPreview && process.env.PREVIEW_USE_SQLITE === "true" ? "file:./prisma/dev.db" : "") ||
    process.env.DATABASE_URL ||
    "file:./prisma/dev.db";

  if (isPreview && !process.env.PREVIEW_DATABASE_URL && process.env.PREVIEW_USE_SQLITE !== "true") {
    console.warn(
      "[Prisma] VERCEL_ENV=preview is using production DATABASE_URL. Set PREVIEW_DATABASE_URL (or PREVIEW_USE_SQLITE=true) in Vercel Preview Environment Variables to avoid production Supabase egress."
    );
  }

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
const isEgressLoggingEnabled =
  process.env.DEBUG_DB_EGRESS === "1" || process.env.DEBUG_DB_EGRESS === "true";

function createBasePrismaClient(): PrismaClient {
  const base = new PrismaClient({
    datasources: {
      db: {
        url: resolvedDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (!isEgressLoggingEnabled) {
    return base;
  }

  // Env-flagged query diagnostics for spotting heavy or repeated queries in dev.
  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const startedAt = Date.now();
          const result = await query(args);
          const elapsedMs = Date.now() - startedAt;
          const rowCount = Array.isArray(result)
            ? result.length
            : result !== null && result !== undefined
            ? 1
            : 0;

          let approxBytes = 0;
          try {
            approxBytes = Buffer.byteLength(JSON.stringify(result) || "", "utf8");
          } catch {
            approxBytes = 0;
          }

          console.info(
            `[DB_EGRESS] ${model}.${operation} rows=${rowCount} approxBytes=${approxBytes} durationMs=${elapsedMs}`
          );
          return result;
        },
      },
    },
  });

  // Keep PrismaClient typing intact so interactive $transaction and groupBy overloads remain compatible.
  return extended as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createBasePrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
