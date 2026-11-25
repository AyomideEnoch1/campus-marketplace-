-- Performance Indexes & Trigram Search Acceleration for Campus Marketplace (PostgreSQL / Supabase)
-- Run in Supabase SQL Editor or via migration

-- 1. Enable pg_trgm for fast ILIKE '%term%' product & store search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Product listing, filtering, sorting, and search indexes
CREATE INDEX IF NOT EXISTS "Product_status_createdAt_idx"
  ON "Product" ("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Product_vendorId_status_idx"
  ON "Product" ("vendorId", "status");

CREATE INDEX IF NOT EXISTS "Product_categoryId_status_idx"
  ON "Product" ("categoryId", "status");

CREATE INDEX IF NOT EXISTS "Product_title_trgm_idx"
  ON "Product" USING gin ("title" gin_trgm_ops);

-- 3. VendorProfile filtering & storefront lookups
CREATE INDEX IF NOT EXISTS "VendorProfile_status_campusId_idx"
  ON "VendorProfile" ("status", "campusId");

-- 4. Order & Escrow queries
CREATE INDEX IF NOT EXISTS "Order_vendorId_status_createdAt_idx"
  ON "Order" ("vendorId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Order_buyerId_createdAt_idx"
  ON "Order" ("buyerId", "createdAt" DESC);

-- 5. Notification & ChatMessage unread/recent lookups
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx"
  ON "Notification" ("userId", "isRead", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_createdAt_idx"
  ON "ChatMessage" ("conversationId", "createdAt" DESC);
