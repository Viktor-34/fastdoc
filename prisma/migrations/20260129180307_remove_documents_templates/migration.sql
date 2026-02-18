-- Drop legacy Document/Template schema (TipTap)
ALTER TABLE "public"."ShareLink" DROP CONSTRAINT IF EXISTS "ShareLink_documentId_fkey";
ALTER TABLE "public"."ShareLink" DROP COLUMN IF EXISTS "documentId";

DROP TABLE IF EXISTS "public"."DocumentVersion";
DROP TABLE IF EXISTS "public"."Document";
DROP TABLE IF EXISTS "public"."Template";
