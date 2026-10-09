CREATE TYPE "KnowledgeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
ALTER TABLE "KnowledgeRecord" ADD COLUMN "slug" TEXT, ADD COLUMN "sourceUrl" TEXT, ADD COLUMN "content" TEXT NOT NULL DEFAULT '', ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "tags" JSONB, ADD COLUMN "status" "KnowledgeStatus" NOT NULL DEFAULT 'DRAFT';
UPDATE "KnowledgeRecord" SET "slug" = 'knowledge-' || "id" WHERE "slug" IS NULL;
ALTER TABLE "KnowledgeRecord" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "KnowledgeRecord" DROP COLUMN "approved";
CREATE UNIQUE INDEX "KnowledgeRecord_slug_key" ON "KnowledgeRecord"("slug");
DROP INDEX IF EXISTS "KnowledgeRecord_category_approved_reviewAt_idx";
CREATE INDEX "KnowledgeRecord_category_status_reviewAt_idx" ON "KnowledgeRecord"("category", "status", "reviewAt");
