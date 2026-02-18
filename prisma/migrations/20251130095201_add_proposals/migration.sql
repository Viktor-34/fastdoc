-- DropForeignKey
ALTER TABLE "public"."ShareLink" DROP CONSTRAINT "ShareLink_documentId_fkey";

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "position" TEXT;

-- AlterTable
ALTER TABLE "public"."ShareLink" ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "proposalId" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "documentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Workspace" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bik" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "inn" TEXT,
ADD COLUMN     "legalAddress" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "ogrn" TEXT,
ADD COLUMN     "signatureUrl" TEXT,
ADD COLUMN     "stampUrl" TEXT,
ADD COLUMN     "vatDefault" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "vatRate" INTEGER NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "public"."Proposal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "recipientName" TEXT,
    "problemDesc" TEXT,
    "solutionDesc" TEXT,
    "additionalDesc" TEXT,
    "items" JSONB NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "deadline" TEXT,
    "paymentTerms" TEXT,
    "paymentCustom" TEXT,
    "validUntil" TIMESTAMP(3),
    "includeVat" BOOLEAN NOT NULL DEFAULT true,
    "vatRate" INTEGER NOT NULL DEFAULT 20,
    "galleryImages" JSONB,
    "ctaText" TEXT,
    "ctaPhone" TEXT,
    "ctaEmail" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProposalVersion" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProposalTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaults" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposal_workspaceId_idx" ON "public"."Proposal"("workspaceId");

-- CreateIndex
CREATE INDEX "Proposal_clientId_idx" ON "public"."Proposal"("clientId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "public"."Proposal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalVersion_proposalId_version_key" ON "public"."ProposalVersion"("proposalId", "version");

-- CreateIndex
CREATE INDEX "ProposalTemplate_workspaceId_idx" ON "public"."ProposalTemplate"("workspaceId");

-- AddForeignKey
ALTER TABLE "public"."ShareLink" ADD CONSTRAINT "ShareLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareLink" ADD CONSTRAINT "ShareLink_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Proposal" ADD CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalVersion" ADD CONSTRAINT "ProposalVersion_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProposalTemplate" ADD CONSTRAINT "ProposalTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
