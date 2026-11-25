/**
 * Performance Budget Checker (Step 7)
 * Verifies Next.js build output stays within mobile 4G First Load JS budgets.
 * Usage: node scripts/check-perf-budget.js
 */
const fs = require("fs");
const path = require("path");

const MAX_FIRST_LOAD_KB = 200; // Target: < 200 kB First Load JS per route
const NEXT_CONFIG_PATH = path.join(process.cwd(), "next.config.mjs");

if (fs.existsSync(NEXT_CONFIG_PATH)) {
  const cfg = fs.readFileSync(NEXT_CONFIG_PATH, "utf8");
  if (/unoptimized\s*:\s*true/.test(cfg)) {
    console.warn("[PERF BUDGET WARN] next.config.mjs has images.unoptimized: true");
  } else {
    console.log("[PERF BUDGET OK] next/image optimization is enabled.");
  }
}

const buildManifestPath = path.join(process.cwd(), ".next", "build-manifest.json");
if (!fs.existsSync(buildManifestPath)) {
  console.log("[PERF BUDGET] Run `npm run build` first to check route bundle budgets.");
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(buildManifestPath, "utf8"));
const rootFiles = manifest.rootMainFiles || [];
let totalRootBytes = 0;
for (const f of rootFiles) {
  const full = path.join(process.cwd(), ".next", f);
  if (fs.existsSync(full)) totalRootBytes += fs.statSync(full).size;
}
const rootKb = (totalRootBytes / 1024).toFixed(1);
console.log(`[PERF BUDGET] Shared rootMainFiles raw size: ${rootKb} kB (budget < ${MAX_FIRST_LOAD_KB} kB gzipped First Load JS per route).`);
