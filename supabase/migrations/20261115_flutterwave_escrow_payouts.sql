-- ==============================================================================
-- FLUTTERWAVE-POWERED ESCROW CHECKOUT & PAYOUTS MIGRATION
-- SUPABASE / POSTGRESQL WITH ROW-LEVEL SECURITY (RLS) & APPEND-ONLY LEDGER
-- ==============================================================================

-- 1. EXTEND ORDER TABLE WITH ESCROW & FLUTTERWAVE COLUMNS
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "tx_ref" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "escrow_status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "subtotal" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "commission" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "seller_amount" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN IF NOT EXISTS "flw_transaction_id" TEXT,
ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "released_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "auto_release_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "dispute_deadline" TIMESTAMP WITH TIME ZONE;

-- Create indexes for order escrow tracking
CREATE INDEX IF NOT EXISTS "Order_tx_ref_idx" ON "Order"("tx_ref");
CREATE INDEX IF NOT EXISTS "Order_escrow_status_idx" ON "Order"("escrow_status");
CREATE INDEX IF NOT EXISTS "Order_flw_transaction_id_idx" ON "Order"("flw_transaction_id");

-- Create compatibility view or table alias if needed for direct lowercase "orders" queries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'orders') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders') THEN
        CREATE VIEW orders AS
        SELECT 
            id,
            "buyerId" AS buyer_id,
            "vendorId" AS seller_id,
            tx_ref,
            escrow_status AS status,
            subtotal,
            commission,
            seller_amount,
            currency,
            flw_transaction_id,
            "meetupPointId" AS meetup_point_id,
            "createdAt" AS created_at,
            paid_at,
            delivered_at,
            confirmed_at,
            released_at,
            auto_release_at,
            dispute_deadline
        FROM "Order";
    END IF;
END $$;

-- 2. CREATE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "flw_transaction_id" TEXT UNIQUE NOT NULL,
    "tx_ref" TEXT UNIQUE NOT NULL,
    "amount" NUMERIC(12, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL, -- 'successful', 'failed', 'cancelled'
    "payment_type" TEXT, -- 'card', 'banktransfer', 'ussd'
    "raw_verify_response" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "payments_order_id_idx" ON "payments"("order_id");
CREATE INDEX IF NOT EXISTS "payments_flw_transaction_id_idx" ON "payments"("flw_transaction_id");
CREATE INDEX IF NOT EXISTS "payments_tx_ref_idx" ON "payments"("tx_ref");

-- 3. CREATE PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "seller_id" TEXT NOT NULL REFERENCES "VendorProfile"("id") ON DELETE CASCADE,
    "amount" NUMERIC(12, 2) NOT NULL,
    "reference" TEXT UNIQUE NOT NULL, -- e.g. payout_ord123_1
    "flw_transfer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'successful', 'failed', 'reversed'
    "failure_reason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "next_retry_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "payouts_order_id_idx" ON "payouts"("order_id");
CREATE INDEX IF NOT EXISTS "payouts_seller_id_idx" ON "payouts"("seller_id");
CREATE INDEX IF NOT EXISTS "payouts_reference_idx" ON "payouts"("reference");
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");
CREATE INDEX IF NOT EXISTS "payouts_next_retry_at_idx" ON "payouts"("next_retry_at");

-- 4. CREATE ESCROW LEDGER TABLE (STRICTLY APPEND-ONLY)
CREATE TABLE IF NOT EXISTS "escrow_ledger" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL, -- 'escrow_in', 'commission', 'escrow_out', 'refund_out', 'adjustment'
    "amount" NUMERIC(12, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reference" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "escrow_ledger_order_id_idx" ON "escrow_ledger"("order_id");
CREATE INDEX IF NOT EXISTS "escrow_ledger_type_idx" ON "escrow_ledger"("type");
CREATE INDEX IF NOT EXISTS "escrow_ledger_reference_idx" ON "escrow_ledger"("reference");
CREATE INDEX IF NOT EXISTS "escrow_ledger_created_at_idx" ON "escrow_ledger"("created_at");

-- TRIGGER: STRICTLY FORBID UPDATE AND DELETE ON escrow_ledger
CREATE OR REPLACE FUNCTION prevent_escrow_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'escrow_ledger is strictly append-only: updates and deletes are prohibited';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_escrow_ledger_modification ON "escrow_ledger";
CREATE TRIGGER trg_prevent_escrow_ledger_modification
BEFORE UPDATE OR DELETE ON "escrow_ledger"
FOR EACH ROW EXECUTE FUNCTION prevent_escrow_ledger_modification();

-- 5. CREATE WEBHOOK EVENTS TABLE (FOR IDEMPOTENCY AND AUDIT)
CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" TEXT PRIMARY KEY,
    "provider" TEXT NOT NULL DEFAULT 'flutterwave',
    "event_id" TEXT UNIQUE NOT NULL, -- flutterwave transaction id or hash
    "event_type" TEXT NOT NULL, -- e.g. 'charge.completed', 'transfer.completed'
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processed', -- 'processed', 'ignored', 'failed'
    "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "webhook_events_event_id_idx" ON "webhook_events"("event_id");
CREATE INDEX IF NOT EXISTS "webhook_events_event_type_idx" ON "webhook_events"("event_type");
CREATE INDEX IF NOT EXISTS "webhook_events_processed_at_idx" ON "webhook_events"("processed_at");

-- 6. CREATE DELIVERY CODES TABLE
CREATE TABLE IF NOT EXISTS "delivery_codes" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT UNIQUE NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "delivery_codes_order_id_idx" ON "delivery_codes"("order_id");

-- 7. CREATE DISPUTES TABLE
CREATE TABLE IF NOT EXISTS "disputes" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT UNIQUE NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "buyer_id" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_paths" JSONB DEFAULT '[]'::jsonb,
    "status" TEXT NOT NULL DEFAULT 'open', -- 'open', 'under_review', 'resolved_refund', 'resolved_release', 'resolved_split'
    "resolution" TEXT, -- 'refund', 'release', 'split'
    "resolution_notes" TEXT,
    "refund_amount" NUMERIC(12, 2) DEFAULT 0.00,
    "seller_release_amount" NUMERIC(12, 2) DEFAULT 0.00,
    "resolved_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "disputes_order_id_idx" ON "disputes"("order_id");
CREATE INDEX IF NOT EXISTS "disputes_buyer_id_idx" ON "disputes"("buyer_id");
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes"("status");

-- 8. CREATE REFUNDS TABLE
CREATE TABLE IF NOT EXISTS "refunds" (
    "id" TEXT PRIMARY KEY,
    "order_id" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "dispute_id" TEXT REFERENCES "disputes"("id") ON DELETE SET NULL,
    "amount" NUMERIC(12, 2) NOT NULL,
    "flw_refund_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'successful', 'failed'
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "refunds_order_id_idx" ON "refunds"("order_id");
CREATE INDEX IF NOT EXISTS "refunds_dispute_id_idx" ON "refunds"("dispute_id");

-- 9. CREATE SELLER BANK ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS "seller_bank_accounts" (
    "id" TEXT PRIMARY KEY,
    "seller_id" TEXT UNIQUE NOT NULL REFERENCES "VendorProfile"("id") ON DELETE CASCADE,
    "bank_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "verified_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_bank_account_across_sellers" UNIQUE ("bank_code", "account_number")
);

CREATE INDEX IF NOT EXISTS "seller_bank_accounts_seller_id_idx" ON "seller_bank_accounts"("seller_id");
CREATE INDEX IF NOT EXISTS "seller_bank_accounts_account_number_idx" ON "seller_bank_accounts"("account_number");

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "escrow_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "delivery_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "disputes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refunds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seller_bank_accounts" ENABLE ROW LEVEL SECURITY;

-- Order Policies
CREATE POLICY "Users can view their own orders as buyer or seller"
ON "Order" FOR SELECT
USING (
    auth.uid()::text = "buyerId"
    OR EXISTS (SELECT 1 FROM "VendorProfile" WHERE id = "Order"."vendorId" AND "userId" = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
);

-- Payments Policies
CREATE POLICY "Users can view payments for their orders"
ON "payments" FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "Order" o 
        WHERE o.id = "payments"."order_id" 
        AND (
            o."buyerId" = auth.uid()::text
            OR EXISTS (SELECT 1 FROM "VendorProfile" vp WHERE vp.id = o."vendorId" AND vp."userId" = auth.uid()::text)
            OR EXISTS (SELECT 1 FROM "User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
        )
    )
);

-- Payouts Policies
CREATE POLICY "Sellers and Admins can view payouts"
ON "payouts" FOR SELECT
USING (
    EXISTS (SELECT 1 FROM "VendorProfile" vp WHERE vp.id = "payouts"."seller_id" AND vp."userId" = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM "User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
);

-- Escrow Ledger Policies: Read-only for parties and Admins
CREATE POLICY "Parties and Admins can read escrow ledger"
ON "escrow_ledger" FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "Order" o 
        WHERE o.id = "escrow_ledger"."order_id" 
        AND (
            o."buyerId" = auth.uid()::text
            OR EXISTS (SELECT 1 FROM "VendorProfile" vp WHERE vp.id = o."vendorId" AND vp."userId" = auth.uid()::text)
            OR EXISTS (SELECT 1 FROM "User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
        )
    )
);

-- Delivery Codes Policies
CREATE POLICY "Buyer can view their delivery code"
ON "delivery_codes" FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM "Order" o 
        WHERE o.id = "delivery_codes"."order_id" 
        AND o."buyerId" = auth.uid()::text
    )
    OR EXISTS (SELECT 1 FROM "User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
);

-- Disputes Policies
CREATE POLICY "Order parties can view disputes"
ON "disputes" FOR SELECT
USING (
    auth.uid()::text = "buyer_id"
    OR EXISTS (
        SELECT 1 FROM "Order" o
        JOIN "VendorProfile" vp ON vp.id = o."vendorId"
        WHERE o.id = "disputes"."order_id" AND vp."userId" = auth.uid()::text
    )
    OR EXISTS (SELECT 1 FROM "User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
);

CREATE POLICY "Buyer can create dispute within window"
ON "disputes" FOR INSERT
WITH CHECK (
    auth.uid()::text = "buyer_id"
);

-- Seller Bank Accounts Policies
CREATE POLICY "Seller can view their own bank account"
ON "seller_bank_accounts" FOR SELECT
USING (
    EXISTS (SELECT 1 FROM "VendorProfile" vp WHERE vp.id = "seller_bank_accounts"."seller_id" AND vp."userId" = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM "User" u WHERE u.id = auth.uid()::text AND u.role = 'ADMIN')
);

-- ==============================================================================
-- 11. HELPER POSTGRESQL FUNCTIONS FOR WALLET & LEDGER BALANCES
-- ==============================================================================

-- Function to calculate seller's current wallet balance from ledger
CREATE OR REPLACE FUNCTION get_seller_wallet_stats(p_seller_id TEXT)
RETURNS TABLE (
    pending_escrow NUMERIC(12, 2),
    available_payout NUMERIC(12, 2),
    total_paid_out NUMERIC(12, 2)
) AS $$
DECLARE
    v_pending NUMERIC(12, 2) := 0.00;
    v_available NUMERIC(12, 2) := 0.00;
    v_paid NUMERIC(12, 2) := 0.00;
BEGIN
    -- Pending: Orders where payment is held in escrow, not yet confirmed/released
    SELECT COALESCE(SUM(seller_amount), 0.00) INTO v_pending
    FROM "Order"
    WHERE "vendorId" = p_seller_id
    AND escrow_status IN ('paid_held', 'delivered');

    -- Available: Orders confirmed where release delay passed, but payout not yet completed
    SELECT COALESCE(SUM(seller_amount), 0.00) INTO v_available
    FROM "Order"
    WHERE "vendorId" = p_seller_id
    AND escrow_status = 'confirmed';

    -- Paid out: Total successful payouts recorded in payouts table
    SELECT COALESCE(SUM(amount), 0.00) INTO v_paid
    FROM "payouts"
    WHERE seller_id = p_seller_id
    AND status = 'successful';

    RETURN QUERY SELECT v_pending, v_available, v_paid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
