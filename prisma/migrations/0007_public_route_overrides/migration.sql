CREATE TABLE "PublicRouteOverride" (
    "routeKey" TEXT NOT NULL,
    "status" "CmsStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "PublicRouteOverride" ADD CONSTRAINT "PublicRouteOverride_pkey" PRIMARY KEY ("routeKey");
CREATE INDEX "PublicRouteOverride_status_updatedAt_idx" ON "PublicRouteOverride"("status", "updatedAt");
