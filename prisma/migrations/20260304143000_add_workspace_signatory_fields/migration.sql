-- Add signatory fields for proposal footer rendering
ALTER TABLE "public"."Workspace"
ADD COLUMN "signatoryRole" TEXT,
ADD COLUMN "signatoryName" TEXT;
