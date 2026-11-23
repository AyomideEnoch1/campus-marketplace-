-- DropIndex
DROP INDEX IF EXISTS "VendorProfile_governmentIdHash_idx";

-- AlterTable
ALTER TABLE "VendorProfile" DROP COLUMN IF EXISTS "governmentIdHash";
