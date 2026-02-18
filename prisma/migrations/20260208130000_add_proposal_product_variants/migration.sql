-- Add support for product variants/groups in proposal products section
ALTER TABLE "Proposal"
ADD COLUMN IF NOT EXISTS "pricingMode" TEXT NOT NULL DEFAULT 'single',
ADD COLUMN IF NOT EXISTS "productVariants" JSONB,
ADD COLUMN IF NOT EXISTS "activeVariantId" TEXT,
ADD COLUMN IF NOT EXISTS "productsView" JSONB;
