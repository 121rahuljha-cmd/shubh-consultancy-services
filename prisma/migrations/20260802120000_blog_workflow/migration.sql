-- AlterEnum
ALTER TYPE "CmsStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "CmsStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "CmsStatus" ADD VALUE IF NOT EXISTS 'CHANGES_REQUESTED';
ALTER TYPE "CmsStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TABLE "BlogPost"
  ADD COLUMN "excerpt" TEXT,
  ADD COLUMN "author" TEXT,
  ADD COLUMN "category" TEXT,
  ADD COLUMN "tags" JSONB DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN "featuredImage" JSONB DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN "seo" JSONB DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN "sections" JSONB DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN "version" INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN "lastPublishedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "approvalReason" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT,
  ADD COLUMN "publishedBy" TEXT,
  ADD COLUMN "approvedBy" TEXT;

ALTER TABLE "BlogRevision"
  ADD COLUMN "changeType" TEXT DEFAULT 'EDIT' NOT NULL;

CREATE INDEX "BlogPost_category_status_idx" ON "BlogPost"("category", "status");
