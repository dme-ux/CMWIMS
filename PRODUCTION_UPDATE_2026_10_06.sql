-- CMW ERP production database update — 06 Oct 2026
-- Safe additive migration for User Access Control + Job Card Approval.

BEGIN;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "customPermissions" JSONB;

ALTER TABLE "WorkshopJob"
  ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "approvalRequestedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvalRequestedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "approvalRemarks" TEXT,
  ADD COLUMN IF NOT EXISTS "approvalWhatsAppSentAt" TIMESTAMP(3);

-- The original seed created these generic demo accounts. They are no longer
-- created by prisma/seed.ts. Deactivate them in production if still present.
UPDATE "User"
SET "isActive" = FALSE, "updatedAt" = NOW()
WHERE "username" IN ('manager','store','accounts','purchase','workshop','advisor','tech','viewer');

COMMIT;
