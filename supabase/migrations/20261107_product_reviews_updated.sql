-- ==============================================================================
-- PRODUCT REVIEWS (UPDATED) MIGRATION & RLS POLICIES FOR SUPABASE / POSTGRESQL
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'FLAGGED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add Aggregate Columns to products and vendor_profiles if not exist
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "ratingBreakdown" TEXT;

ALTER TABLE "VendorProfile"
ADD COLUMN IF NOT EXISTS "sellerAvgRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "sellerReviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "communicationAvg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "punctualityAvg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "behaviorAvg" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- 3. Product Reviews Table
CREATE TABLE IF NOT EXISTS "ProductReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderItemId" TEXT NOT NULL UNIQUE REFERENCES "OrderItem"("id") ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "buyerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "sellerId" TEXT NOT NULL REFERENCES "VendorProfile"("id") ON DELETE CASCADE,
    "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" TEXT,
    "tags" TEXT, -- JSON array of tags: ["As described", "Good quality"]
    "photoPaths" TEXT, -- JSON array of image URLs (up to 3)
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ProductReview_productId_idx" ON "ProductReview"("productId");
CREATE INDEX IF NOT EXISTS "ProductReview_sellerId_idx" ON "ProductReview"("sellerId");
CREATE INDEX IF NOT EXISTS "ProductReview_buyerId_idx" ON "ProductReview"("buyerId");
CREATE INDEX IF NOT EXISTS "ProductReview_status_idx" ON "ProductReview"("status");
CREATE INDEX IF NOT EXISTS "ProductReview_createdAt_idx" ON "ProductReview"("createdAt");

-- 4. Seller Ratings Table (Separate 1-5 stars for communication, punctuality, behavior)
CREATE TABLE IF NOT EXISTS "SellerRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "buyerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "sellerId" TEXT NOT NULL REFERENCES "VendorProfile"("id") ON DELETE CASCADE,
    "communication" INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5),
    "punctuality" INTEGER NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
    "behavior" INTEGER NOT NULL CHECK (behavior >= 1 AND behavior <= 5),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerRating_order_buyer_unique" UNIQUE ("orderId", "buyerId")
);

CREATE INDEX IF NOT EXISTS "SellerRating_sellerId_idx" ON "SellerRating"("sellerId");

-- 5. Helpful Votes Table (1 vote per user per review)
CREATE TABLE IF NOT EXISTS "ReviewHelpfulVote" (
    "reviewId" TEXT NOT NULL REFERENCES "ProductReview"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("reviewId", "userId")
);

CREATE INDEX IF NOT EXISTS "ReviewHelpfulVote_reviewId_idx" ON "ReviewHelpfulVote"("reviewId");

-- 6. Review Replies Table (One reply per review from seller)
CREATE TABLE IF NOT EXISTS "ReviewReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL UNIQUE REFERENCES "ProductReview"("id") ON DELETE CASCADE,
    "sellerId" TEXT NOT NULL REFERENCES "VendorProfile"("id") ON DELETE CASCADE,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ReviewReply_reviewId_idx" ON "ReviewReply"("reviewId");

-- 7. Review Reports Table
CREATE TABLE IF NOT EXISTS "ReviewReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL REFERENCES "ProductReview"("id") ON DELETE CASCADE,
    "reporterId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "reason" TEXT NOT NULL, -- SPAM, ABUSIVE_LANGUAGE, FAKE_REVIEW, IRRELEVANT
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ReviewReport_reviewId_idx" ON "ReviewReport"("reviewId");
CREATE INDEX IF NOT EXISTS "ReviewReport_status_idx" ON "ReviewReport"("status");

-- ==============================================================================
-- DATABASE TRIGGER: MAINTAIN PRODUCT RATING & STAR BREAKDOWN AGGREGATES
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_product_review_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id TEXT;
    v_count INTEGER;
    v_avg DOUBLE PRECISION;
    c1 INTEGER; c2 INTEGER; c3 INTEGER; c4 INTEGER; c5 INTEGER;
BEGIN
    target_product_id := COALESCE(NEW."productId", OLD."productId");

    SELECT 
        COUNT(*),
        COALESCE(AVG(rating), 0),
        COUNT(*) FILTER (WHERE rating = 1),
        COUNT(*) FILTER (WHERE rating = 2),
        COUNT(*) FILTER (WHERE rating = 3),
        COUNT(*) FILTER (WHERE rating = 4),
        COUNT(*) FILTER (WHERE rating = 5)
    INTO v_count, v_avg, c1, c2, c3, c4, c5
    FROM "ProductReview"
    WHERE "productId" = target_product_id AND "status" = 'PUBLISHED';

    UPDATE "Product"
    SET 
        "reviewCount" = v_count,
        "avgRating" = ROUND(v_avg::numeric, 1),
        "ratingBreakdown" = json_build_object(
            '1', c1,
            '2', c2,
            '3', c3,
            '4', c4,
            '5', c5
        )::text
    WHERE "id" = target_product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_product_review_aggregates ON "ProductReview";
CREATE TRIGGER trg_update_product_review_aggregates
AFTER INSERT OR UPDATE OR DELETE ON "ProductReview"
FOR EACH ROW
EXECUTE FUNCTION update_product_review_aggregates();

-- ==============================================================================
-- DATABASE TRIGGER: MAINTAIN SELLER RATING AGGREGATES
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_seller_rating_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    target_seller_id TEXT;
    v_count INTEGER;
    v_comm DOUBLE PRECISION;
    v_punct DOUBLE PRECISION;
    v_behav DOUBLE PRECISION;
    v_overall DOUBLE PRECISION;
BEGIN
    target_seller_id := COALESCE(NEW."sellerId", OLD."sellerId");

    SELECT 
        COUNT(*),
        COALESCE(AVG(communication), 0),
        COALESCE(AVG(punctuality), 0),
        COALESCE(AVG(behavior), 0)
    INTO v_count, v_comm, v_punct, v_behav
    FROM "SellerRating"
    WHERE "sellerId" = target_seller_id;

    v_overall := CASE WHEN v_count > 0 THEN (v_comm + v_punct + v_behav) / 3.0 ELSE 0.0 END;

    UPDATE "VendorProfile"
    SET 
        "sellerReviewCount" = v_count,
        "communicationAvg" = ROUND(v_comm::numeric, 1),
        "punctualityAvg" = ROUND(v_punct::numeric, 1),
        "behaviorAvg" = ROUND(v_behav::numeric, 1),
        "sellerAvgRating" = ROUND(v_overall::numeric, 1)
    WHERE "id" = target_seller_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_seller_rating_aggregates ON "SellerRating";
CREATE TRIGGER trg_update_seller_rating_aggregates
AFTER INSERT OR UPDATE OR DELETE ON "SellerRating"
FOR EACH ROW
EXECUTE FUNCTION update_seller_rating_aggregates();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE "ProductReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SellerRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewHelpfulVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewReply" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewReport" ENABLE ROW LEVEL SECURITY;

-- 1. ProductReview: Public can read published reviews
CREATE POLICY "Public can view published product reviews"
ON "ProductReview" FOR SELECT
USING ("status" = 'PUBLISHED' OR auth.uid() = "buyerId");

-- Buyers can insert review only for their own completed order item
CREATE POLICY "Buyers can review own completed order items"
ON "ProductReview" FOR INSERT
WITH CHECK (
    auth.uid() = "buyerId"
    AND EXISTS (
        SELECT 1 FROM "OrderItem" oi
        JOIN "Order" o ON oi."orderId" = o."id"
        WHERE oi."id" = "orderItemId"
        AND o."buyerId" = auth.uid()
        AND o."status" IN ('CONFIRMED', 'DELIVERED')
    )
);

-- Buyers can update review only within 7 days
CREATE POLICY "Buyers can edit own reviews within 7 days"
ON "ProductReview" FOR UPDATE
USING (
    auth.uid() = "buyerId"
    AND "createdAt" >= (NOW() - INTERVAL '7 days')
);

-- Buyers or Admins can delete
CREATE POLICY "Authors or Admins can delete review"
ON "ProductReview" FOR DELETE
USING (
    auth.uid() = "buyerId"
    OR EXISTS (SELECT 1 FROM "User" u WHERE u."id" = auth.uid() AND u."role" = 'ADMIN')
);

-- 2. Helpful Votes: Authenticated users only, not on own review
CREATE POLICY "Authenticated users can vote helpful"
ON "ReviewHelpfulVote" FOR INSERT
WITH CHECK (
    auth.uid() = "userId"
    AND NOT EXISTS (
        SELECT 1 FROM "ProductReview" pr
        WHERE pr."id" = "reviewId" AND pr."buyerId" = auth.uid()
    )
);

-- 3. Review Replies: Only the seller of the product can reply
CREATE POLICY "Sellers can reply to reviews on their products"
ON "ReviewReply" FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM "VendorProfile" vp
        WHERE vp."id" = "sellerId" AND vp."userId" = auth.uid()
    )
);

CREATE POLICY "Sellers can edit reply within 24 hours"
ON "ReviewReply" FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM "VendorProfile" vp
        WHERE vp."id" = "sellerId" AND vp."userId" = auth.uid()
    )
    AND "createdAt" >= (NOW() - INTERVAL '24 hours')
);

-- 4. Review Reports: Any authenticated user can submit report
CREATE POLICY "Authenticated users can report review"
ON "ReviewReport" FOR INSERT
WITH CHECK (auth.uid() = "reporterId");
