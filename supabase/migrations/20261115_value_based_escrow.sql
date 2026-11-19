-- ==============================================================================
-- VALUE-BASED ESCROW MIGRATION (THRESHOLDS, FEES, FORCED ESCROW)
-- ==============================================================================

-- 1. ADD VALUE-BASED ESCROW COLUMNS TO Order
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "escrow_mode" TEXT NOT NULL DEFAULT 'escrow',
ADD COLUMN IF NOT EXISTS "escrow_forced_reason" TEXT,
ADD COLUMN IF NOT EXISTS "fee_amount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "fee_percent" NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "fee_payer" TEXT NOT NULL DEFAULT 'buyer',
ADD COLUMN IF NOT EXISTS "settings_snapshot" JSONB;

-- Constraint: Escrow is mandatory whenever subtotal >= ₦20,000 (2,000,000 kobo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_order_mandatory_escrow_over_20k'
    ) THEN
        ALTER TABLE "Order"
        ADD CONSTRAINT check_order_mandatory_escrow_over_20k
        CHECK (subtotal < 20000.00 OR escrow_mode = 'escrow');
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Order_escrow_mode_idx" ON "Order"("escrow_mode");

-- 2. CREATE PLATFORM SETTINGS TABLE (ADMIN-CONFIGURABLE)
CREATE TABLE IF NOT EXISTS "platform_settings" (
    "key" TEXT PRIMARY KEY,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit table for platform settings changes
CREATE TABLE IF NOT EXISTS "platform_settings_audit" (
    "id" TEXT PRIMARY KEY,
    "key" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB NOT NULL,
    "changed_by" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "platform_settings_audit_key_idx" ON "platform_settings_audit"("key");
CREATE INDEX IF NOT EXISTS "platform_settings_audit_created_at_idx" ON "platform_settings_audit"("created_at");

-- 3. SEED DEFAULT ESCROW & VALUE-BASED RULES SETTINGS (IN KOBO & INTEGER PRECISION)
INSERT INTO "platform_settings" ("key", "value", "description")
VALUES 
    ('escrow_thresholds', '{
        "escrow_optional_min_kobo": 500000,
        "escrow_mandatory_min_kobo": 2000000,
        "min_order_value_kobo": 50000,
        "direct_order_max_total_kobo": 1999900,
        "direct_orders_per_day_buyer_limit": 5,
        "direct_orders_per_day_seller_limit": 10
    }'::jsonb, 'Thresholds for direct, optional, and mandatory escrow modes in kobo'),
    ('escrow_fees', '{
        "fee_band_1_percent": 0.0,
        "fee_band_2_percent": 1.0,
        "fee_band_3_percent": 2.0,
        "fee_min_kobo": 5000,
        "fee_max_kobo": 500000,
        "fee_payer": "buyer",
        "direct_service_fee_kobo": 0
    }'::jsonb, 'Escrow fee bands and payer settings'),
    ('forced_escrow_rules', '{
        "guest_vendor": true,
        "below_tier_4": true,
        "active_strike_or_hold": true,
        "joined_under_30_days": true,
        "new_buyer_over_5k": true,
        "restricted_category": true,
        "restricted_categories": ["electronics", "phones-tablets", "laptops-computers", "food-groceries", "beauty-care"]
    }'::jsonb, 'Rules that enforce mandatory escrow regardless of price')
ON CONFLICT ("key") DO NOTHING;

-- 4. RLS POLICIES FOR PLATFORM SETTINGS
ALTER TABLE "platform_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_settings_audit" ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (for quotes/checkout), only Admins can write
CREATE POLICY "Public read platform settings"
ON "platform_settings" FOR SELECT
USING (true);

CREATE POLICY "Admin write platform settings"
ON "platform_settings" FOR ALL
USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
);

CREATE POLICY "Admin read platform settings audit"
ON "platform_settings_audit" FOR SELECT
USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
);
