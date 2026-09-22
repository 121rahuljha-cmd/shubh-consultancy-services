CREATE TYPE "CmsStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR', 'AUTHOR', 'SEO_MANAGER');
CREATE TYPE "RevisionChangeType" AS ENUM ('CREATE', 'EDIT', 'AI_ACCEPT', 'PUBLISH', 'UNPUBLISH', 'RESTORE');
CREATE TYPE "AiJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "Service" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "locality" TEXT,
  "pincode" TEXT,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

CREATE TABLE "ServicePage" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "locationId" TEXT,
  "content" JSONB NOT NULL,
  "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  CONSTRAINT "ServicePage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServicePage_serviceId_locationId_key" ON "ServicePage"("serviceId", "locationId");
CREATE UNIQUE INDEX "ServicePage_generic_service_key" ON "ServicePage"("serviceId") WHERE "locationId" IS NULL;
CREATE INDEX "ServicePage_status_idx" ON "ServicePage"("status");
CREATE INDEX "ServicePage_serviceId_idx" ON "ServicePage"("serviceId");
CREATE INDEX "ServicePage_locationId_idx" ON "ServicePage"("locationId");
CREATE INDEX "ServicePage_publishedAt_idx" ON "ServicePage"("publishedAt");
ALTER TABLE "ServicePage" ADD CONSTRAINT "ServicePage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServicePage" ADD CONSTRAINT "ServicePage_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");
CREATE INDEX "Location_status_idx" ON "Location"("status");
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SeoMetadata" (
  "id" TEXT NOT NULL,
  "servicePageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "canonical" TEXT NOT NULL,
  "robots" TEXT NOT NULL DEFAULT 'index,follow',
  "ogTitle" TEXT NOT NULL,
  "ogDescription" TEXT NOT NULL,
  "primaryKeyword" TEXT NOT NULL,
  CONSTRAINT "SeoMetadata_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SeoMetadata_servicePageId_key" ON "SeoMetadata"("servicePageId");
CREATE INDEX "SeoMetadata_canonical_idx" ON "SeoMetadata"("canonical");
CREATE INDEX "SeoMetadata_primaryKeyword_idx" ON "SeoMetadata"("primaryKeyword");
ALTER TABLE "SeoMetadata" ADD CONSTRAINT "SeoMetadata_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "ServicePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContentBlueprint" (
  "id" TEXT NOT NULL,
  "servicePageId" TEXT NOT NULL,
  "blueprintData" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentBlueprint_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentBlueprint_servicePageId_key" ON "ContentBlueprint"("servicePageId");
ALTER TABLE "ContentBlueprint" ADD CONSTRAINT "ContentBlueprint_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "ServicePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Faq" (
  "id" TEXT NOT NULL,
  "servicePageId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Faq_servicePageId_enabled_sortOrder_idx" ON "Faq"("servicePageId", "enabled", "sortOrder");
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "ServicePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SeoResearch" (
  "id" TEXT NOT NULL,
  "servicePageId" TEXT NOT NULL,
  "researchData" JSONB NOT NULL,
  "researchMode" TEXT NOT NULL,
  "researchedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeoResearch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SeoResearch_servicePageId_researchedAt_idx" ON "SeoResearch"("servicePageId", "researchedAt");
ALTER TABLE "SeoResearch" ADD CONSTRAINT "SeoResearch_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "ServicePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContentRevision" (
  "id" TEXT NOT NULL,
  "servicePageId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "changedBy" TEXT NOT NULL,
  "changeType" "RevisionChangeType" NOT NULL,
  "status" "CmsStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentRevision_servicePageId_version_key" ON "ContentRevision"("servicePageId", "version");
CREATE INDEX "ContentRevision_servicePageId_createdAt_idx" ON "ContentRevision"("servicePageId", "createdAt");
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "ServicePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "mimeType" TEXT NOT NULL,
  "storageKey" TEXT,
  "fileSize" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

CREATE TABLE "AiGenerationJob" (
  "id" TEXT NOT NULL,
  "servicePageId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" "AiJobStatus" NOT NULL DEFAULT 'QUEUED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "errorMessage" TEXT,
  "inputHash" TEXT NOT NULL,
  "tokenCount" INTEGER,
  "estimatedCost" DECIMAL(12,6),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiGenerationJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiGenerationJob_status_createdAt_idx" ON "AiGenerationJob"("status", "createdAt");
CREATE INDEX "AiGenerationJob_servicePageId_status_idx" ON "AiGenerationJob"("servicePageId", "status");
CREATE INDEX "AiGenerationJob_inputHash_idx" ON "AiGenerationJob"("inputHash");
ALTER TABLE "AiGenerationJob" ADD CONSTRAINT "AiGenerationJob_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "ServicePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
