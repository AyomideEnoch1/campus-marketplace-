/**
 * Safety guard for database seed, test, and inspection scripts.
 * Prevents accidental execution against production environments or unconfigured placeholders.
 */
require('dotenv').config();

function ensureSafeDb(scriptName = 'database script', options = {}) {
  const { allowProd = false } = options;
  const allowOverride = process.env.ALLOW_PROD_DB_SCRIPT === 'true';

  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();

  if ((nodeEnv === 'production' || vercelEnv === 'production') && !allowProd && !allowOverride) {
    console.error(
      `[ABORTED] Refusing to run "${scriptName}" in production environment (NODE_ENV=${process.env.NODE_ENV}, VERCEL_ENV=${process.env.VERCEL_ENV}).\n` +
      `Set ALLOW_PROD_DB_SCRIPT=true only if you explicitly intend to target production.`
    );
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const prodRef = (process.env.PROD_SUPABASE_PROJECT_REF || '').trim();

  if (prodRef && !allowProd && !allowOverride) {
    const hitsProd =
      dbUrl.includes(prodRef) ||
      directUrl.includes(prodRef) ||
      supabaseUrl.includes(prodRef);

    if (hitsProd) {
      console.error(
        `[ABORTED] Refusing to run "${scriptName}": configured URLs match PROD_SUPABASE_PROJECT_REF (${prodRef}).\n` +
        `Point .env / .env.local to a dev/staging database before running this script.`
      );
      process.exit(1);
    }
  }

  if (dbUrl.includes('your-dev-project') || directUrl.includes('your-dev-project')) {
    console.error(
      `[ABORTED] Cannot run "${scriptName}": DATABASE_URL is still set to the placeholder "your-dev-project".\n` +
      `Configure a dev/staging DATABASE_URL (or use "npm run db:sqlite" for local SQLite).`
    );
    process.exit(1);
  }
}

module.exports = { ensureSafeDb };
