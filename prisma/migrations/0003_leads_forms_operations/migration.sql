CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'CLOSED', 'SPAM', 'ARCHIVED');

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "whatsapp" TEXT,
  "email" TEXT,
  "businessName" TEXT,
  "businessType" TEXT,
  "service" TEXT,
  "category" TEXT,
  "state" TEXT,
  "city" TEXT,
  "message" TEXT,
  "landingPage" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "assignedTo" TEXT,
  "followUpAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Lead_status_updatedAt_idx" ON "Lead"("status", "updatedAt");
CREATE INDEX "Lead_mobile_idx" ON "Lead"("mobile");
CREATE INDEX "Lead_email_idx" ON "Lead"("email");
CREATE INDEX "Lead_service_createdAt_idx" ON "Lead"("service", "createdAt");

CREATE TABLE "ContactForm" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "fields" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactForm_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContactForm_slug_key" ON "ContactForm"("slug");

CREATE TABLE "FormSubmission" (
  "id" TEXT NOT NULL,
  "formId" TEXT,
  "payload" JSONB NOT NULL,
  "landingPage" TEXT,
  "pageTitle" TEXT,
  "service" TEXT,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FormSubmission_formId_createdAt_idx" ON "FormSubmission"("formId", "createdAt");
CREATE INDEX "FormSubmission_createdAt_idx" ON "FormSubmission"("createdAt");
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "ContactForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "RedirectRule" (
  "id" TEXT NOT NULL,
  "oldPath" TEXT NOT NULL,
  "newPath" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL DEFAULT 301,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RedirectRule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RedirectRule_oldPath_key" ON "RedirectRule"("oldPath");
CREATE INDEX "RedirectRule_active_oldPath_idx" ON "RedirectRule"("active", "oldPath");

CREATE TABLE "GlobalSetting" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GlobalSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GlobalSetting_key_key" ON "GlobalSetting"("key");

CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ActivityLog_entity_entityId_createdAt_idx" ON "ActivityLog"("entity", "entityId", "createdAt");
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

CREATE TABLE "KnowledgeRecord" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "fact" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "effectiveAt" TIMESTAMP(3),
  "reviewAt" TIMESTAMP(3),
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KnowledgeRecord_category_approved_reviewAt_idx" ON "KnowledgeRecord"("category", "approved", "reviewAt");
