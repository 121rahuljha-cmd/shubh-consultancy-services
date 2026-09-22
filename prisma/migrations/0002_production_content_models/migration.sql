ALTER TABLE "Service" ADD COLUMN "description" TEXT NOT NULL DEFAULT '', ADD COLUMN "icon" TEXT NOT NULL DEFAULT '', ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "CmsSection" (
  "id" TEXT NOT NULL,
  "servicePageId" TEXT NOT NULL,
  "sectionData" JSONB NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CmsSection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CmsSection_servicePageId_displayOrder_idx" ON "CmsSection"("servicePageId", "displayOrder");
CREATE INDEX "CmsSection_status_idx" ON "CmsSection"("status");
ALTER TABLE "CmsSection" ADD CONSTRAINT "CmsSection_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "ServicePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InternalLink" (
  "id" TEXT NOT NULL,
  "sourcePageId" TEXT NOT NULL,
  "targetPageId" TEXT,
  "anchorText" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InternalLink_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InternalLink_sourcePageId_status_displayOrder_idx" ON "InternalLink"("sourcePageId", "status", "displayOrder");
CREATE INDEX "InternalLink_targetPageId_idx" ON "InternalLink"("targetPageId");
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "ServicePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalLink" ADD CONSTRAINT "InternalLink_targetPageId_fkey" FOREIGN KEY ("targetPageId") REFERENCES "ServicePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ContentPlan" (
  "id" TEXT NOT NULL,
  "servicePageId" TEXT,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "pageType" TEXT NOT NULL,
  "serviceId" TEXT,
  "stateId" TEXT,
  "cityId" TEXT,
  "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
  "planData" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentPlan_status_updatedAt_idx" ON "ContentPlan"("status", "updatedAt");
CREATE INDEX "ContentPlan_serviceId_stateId_cityId_idx" ON "ContentPlan"("serviceId", "stateId", "cityId");
CREATE UNIQUE INDEX "ContentPlan_slug_pageType_serviceId_stateId_cityId_key" ON "ContentPlan"("slug", "pageType", "serviceId", "stateId", "cityId");
ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_servicePageId_fkey" FOREIGN KEY ("servicePageId") REFERENCES "ServicePage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "BlogPost" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_updatedAt_idx" ON "BlogPost"("status", "updatedAt");

CREATE TABLE "BlogRevision" (
  "id" TEXT NOT NULL,
  "blogPostId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" JSONB NOT NULL,
  "changedBy" TEXT NOT NULL,
  "status" "CmsStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BlogRevision_blogPostId_version_key" ON "BlogRevision"("blogPostId", "version");
CREATE INDEX "BlogRevision_blogPostId_createdAt_idx" ON "BlogRevision"("blogPostId", "createdAt");
ALTER TABLE "BlogRevision" ADD CONSTRAINT "BlogRevision_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
