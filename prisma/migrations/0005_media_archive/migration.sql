ALTER TABLE "MediaAsset" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "MediaAsset_archived_createdAt_idx" ON "MediaAsset"("archived", "createdAt");
