-- ==============================================================================
-- GUEST VENDOR REGISTRATION, VERIFICATION, & SAFE MEETUP POINTS MIGRATION
-- SUPABASE / POSTGRESQL WITH ROW-LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. ADD NEW GUEST VENDOR & VERIFICATION COLUMNS TO VendorProfile
ALTER TABLE "VendorProfile"
ADD COLUMN IF NOT EXISTS "sellerType" TEXT NOT NULL DEFAULT 'student',
ADD COLUMN IF NOT EXISTS "verificationTier" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "businessName" TEXT,
ADD COLUMN IF NOT EXISTS "businessCategory" TEXT,
ADD COLUMN IF NOT EXISTS "businessAddress" TEXT,
ADD COLUMN IF NOT EXISTS "businessPhotoPath" TEXT,
ADD COLUMN IF NOT EXISTS "cacNumber" TEXT,
ADD COLUMN IF NOT EXISTS "cacDocumentPath" TEXT,
ADD COLUMN IF NOT EXISTS "isRegisteredBusiness" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "governmentIdType" TEXT,
ADD COLUMN IF NOT EXISTS "governmentIdHash" TEXT,
ADD COLUMN IF NOT EXISTS "idDocumentPath" TEXT,
ADD COLUMN IF NOT EXISTS "selfieDocumentPath" TEXT,
ADD COLUMN IF NOT EXISTS "vouchedBy" TEXT,
ADD COLUMN IF NOT EXISTS "isTrustedSeller" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "payoutDelayHours" INTEGER NOT NULL DEFAULT 48,
ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT,
ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT,
ADD COLUMN IF NOT EXISTS "bankCode" TEXT,
ADD COLUMN IF NOT EXISTS "bankName" TEXT,
ADD COLUMN IF NOT EXISTS "bankResolvedName" TEXT,
ADD COLUMN IF NOT EXISTS "bankVerified" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "strikesCount" INTEGER NOT NULL DEFAULT 0;

-- Indexes for duplicate checks and seller type filtering
CREATE INDEX IF NOT EXISTS "VendorProfile_sellerType_idx" ON "VendorProfile"("sellerType");
CREATE INDEX IF NOT EXISTS "VendorProfile_governmentIdHash_idx" ON "VendorProfile"("governmentIdHash");
CREATE INDEX IF NOT EXISTS "VendorProfile_bankAccountNumber_idx" ON "VendorProfile"("bankAccountNumber");

-- 2. CREATE CampusSetting TABLE
CREATE TABLE IF NOT EXISTS "CampusSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campusId" TEXT NOT NULL UNIQUE REFERENCES "Campus"("id") ON DELETE CASCADE,
    "guestVendorsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "guestVendorCap" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "CampusSetting_campusId_idx" ON "CampusSetting"("campusId");

-- 3. CREATE SafeMeetupPoint TABLE
CREATE TABLE IF NOT EXISTS "SafeMeetupPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campusId" TEXT NOT NULL REFERENCES "Campus"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SafeMeetupPoint_campusId_idx" ON "SafeMeetupPoint"("campusId");
CREATE INDEX IF NOT EXISTS "SafeMeetupPoint_active_idx" ON "SafeMeetupPoint"("active");

-- 4. ADD meetupPointId TO Order
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "meetupPointId" TEXT REFERENCES "SafeMeetupPoint"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Order_meetupPointId_idx" ON "Order"("meetupPointId");

-- 5. CREATE Vouch TABLE
CREATE TABLE IF NOT EXISTS "Vouch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "guestId" TEXT NOT NULL REFERENCES "VendorProfile"("id") ON DELETE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Vouch_voucherId_idx" ON "Vouch"("voucherId");
CREATE INDEX IF NOT EXISTS "Vouch_guestId_idx" ON "Vouch"("guestId");

-- 6. PRIVATE STORAGE BUCKET FOR VERIFICATION DOCUMENTS (NDPA COMPLIANT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vendor-verification-documents',
    'vendor-verification-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS: Owner and Admins only
CREATE POLICY "Vendor Document Owner Read"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'vendor-verification-documents'
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
    )
);

CREATE POLICY "Vendor Document Owner Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'vendor-verification-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendor Document Owner Delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'vendor-verification-documents'
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
    )
);

-- 7. ROW LEVEL SECURITY (RLS) FOR TABLES
ALTER TABLE "VendorProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampusSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SafeMeetupPoint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vouch" ENABLE ROW LEVEL SECURITY;

-- SafeMeetupPoint Policies
CREATE POLICY "Anyone can read active safe meetup points"
ON "SafeMeetupPoint" FOR SELECT
USING (active = TRUE OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'));

CREATE POLICY "Admins can manage safe meetup points"
ON "SafeMeetupPoint" FOR ALL
USING (EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'));

-- CampusSetting Policies
CREATE POLICY "Anyone can view campus settings"
ON "CampusSetting" FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage campus settings"
ON "CampusSetting" FOR ALL
USING (EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'));

-- Vouch Policies
CREATE POLICY "Public can view accepted vouches"
ON "Vouch" FOR SELECT
USING (status = 'ACCEPTED' OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'));

CREATE POLICY "Trusted sellers and admins can insert vouches"
ON "Vouch" FOR INSERT
WITH CHECK (
    auth.uid()::text = "voucherId"
    AND (
        EXISTS (SELECT 1 FROM "VendorProfile" WHERE "userId" = auth.uid()::text AND "isTrustedSeller" = TRUE)
        OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN')
    )
);

-- 8. SEED DEFAULT SAFE MEETUP POINTS FOR LIVE CAMPUSES
DO $$
DECLARE
    unilag_id TEXT;
    ui_id TEXT;
    oau_id TEXT;
BEGIN
    SELECT id INTO unilag_id FROM "Campus" WHERE slug = 'unilag' LIMIT 1;
    SELECT id INTO ui_id FROM "Campus" WHERE slug = 'ui' LIMIT 1;
    SELECT id INTO oau_id FROM "Campus" WHERE slug = 'oau' LIMIT 1;

    IF unilag_id IS NOT NULL THEN
        INSERT INTO "CampusSetting" ("id", "campusId", "guestVendorsEnabled", "guestVendorCap", "updatedAt")
        VALUES (concat('cs_', unilag_id), unilag_id, TRUE, 50, CURRENT_TIMESTAMP)
        ON CONFLICT ("campusId") DO NOTHING;

        INSERT INTO "SafeMeetupPoint" ("id", "campusId", "name", "description", "active", "updatedAt") VALUES
        (concat('smp_', unilag_id, '_1'), unilag_id, 'UNILAG Main Library Quad & Foyer', 'High-traffic daytime public zone directly in front of Main Library', TRUE, CURRENT_TIMESTAMP),
        (concat('smp_', unilag_id, '_2'), unilag_id, 'Student Union Building (SUB) Concourse', 'Central student hub with security personnel present', TRUE, CURRENT_TIMESTAMP),
        (concat('smp_', unilag_id, '_3'), unilag_id, 'Campus Main Gate Security Hub', 'Designated visitor and off-campus exchange bay at University Road', TRUE, CURRENT_TIMESTAMP),
        (concat('smp_', unilag_id, '_4'), unilag_id, 'Faculty of Arts Covered Car Park Walkway', 'Visible well-lit pedestrian walkway during daytime hours', TRUE, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO NOTHING;
    END IF;

    IF ui_id IS NOT NULL THEN
        INSERT INTO "CampusSetting" ("id", "campusId", "guestVendorsEnabled", "guestVendorCap", "updatedAt")
        VALUES (concat('cs_', ui_id), ui_id, TRUE, 40, CURRENT_TIMESTAMP)
        ON CONFLICT ("campusId") DO NOTHING;

        INSERT INTO "SafeMeetupPoint" ("id", "campusId", "name", "description", "active", "updatedAt") VALUES
        (concat('smp_', ui_id, '_1'), ui_id, 'Kenneth Dike Library Front Steps', 'Central open-air meeting plaza in front of the University Library', TRUE, CURRENT_TIMESTAMP),
        (concat('smp_', ui_id, '_2'), ui_id, 'UI SUB Amphitheatre / Food Court', 'Bustling student social center with ample seating and daylight visibility', TRUE, CURRENT_TIMESTAMP),
        (concat('smp_', ui_id, '_3'), ui_id, 'UI Main Gate Visitor Security Post', 'Designated safe pickup post beside the primary entrance gate', TRUE, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO NOTHING;
    END IF;

    IF oau_id IS NOT NULL THEN
        INSERT INTO "CampusSetting" ("id", "campusId", "guestVendorsEnabled", "guestVendorCap", "updatedAt")
        VALUES (concat('cs_', oau_id), oau_id, TRUE, 40, CURRENT_TIMESTAMP)
        ON CONFLICT ("campusId") DO NOTHING;

        INSERT INTO "SafeMeetupPoint" ("id", "campusId", "name", "description", "active", "updatedAt") VALUES
        (concat('smp_', oau_id, '_1'), oau_id, 'Hezekiah Oluwasanmi Library Steps', 'Iconic central campus meeting landmark with high foot traffic', TRUE, CURRENT_TIMESTAMP),
        (concat('smp_', oau_id, '_2'), oau_id, 'Ken Saro-Wiwa (SUB) Building Frontage', 'Student Union building forecourt with active campus surveillance', TRUE, CURRENT_TIMESTAMP),
        (concat('smp_', oau_id, '_3'), oau_id, 'OAU Campus Main Gate Pavilion', 'Safe transfer area located at the university main access gates', TRUE, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO NOTHING;
    END IF;
END $$;
