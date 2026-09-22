import type { ServiceBuilderRecord } from '@/lib/service-builder'
import type { SeoResearchRecord } from '@/lib/seo-research'

export type CmsStatus = 'draft' | 'published' | 'unpublished'
export type LocationRecord = { id: string; country: string; state: string; district?: string; city: string; locality?: string; pincode?: string; slug: string; parentId?: string | null; status: CmsStatus; createdAt: string; updatedAt: string }
export type ServiceRecord = { id: string; name: string; slug: string; category: string; status: CmsStatus; createdAt: string; updatedAt: string }
export type ServicePageRecord = { id: string; serviceId: string; locationId: string | null; content: ServiceBuilderRecord; status: CmsStatus; version: number; createdAt: string; updatedAt: string; publishedAt: string | null }
export type SeoMetadataRecord = { id: string; servicePageId: string; title: string; description: string; canonical: string; robots: string; ogTitle: string; ogDescription: string; primaryKeyword: string }
export type FaqRecord = { id: string; servicePageId: string; question: string; answer: string; sortOrder: number; enabled: boolean }
export type ContentRevision = { id: string; servicePageId: string; version: number; content: Partial<ServiceBuilderRecord>; changedBy: string; changeType: 'create' | 'edit' | 'ai-accept' | 'publish' | 'unpublish' | 'restore'; createdAt: string; status: CmsStatus }
export type MediaAssetRecord = { id: string; filename: string; url: string; alt: string; title: string; width: number | null; height: number | null; mimeType: string; createdAt: string }
export type AiJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type AiGenerationJobRecord = { id: string; servicePageId: string; action: string; status: AiJobStatus; attempts: number; maxAttempts: number; errorMessage: string | null; inputHash: string; tokenCount?: number | null; estimatedCost?: number | null; startedAt: string | null; completedAt: string | null; createdAt: string; updatedAt: string }
export type AdminRole = 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'SEO_MANAGER'
export type AdminUserRecord = { id: string; username: string; passwordHash: string; role: AdminRole; createdAt: string; updatedAt: string }
export type MigrationIssue = { slug: string; reason: string }
export type MigrationReport = { dryRun: boolean; imported: number; skipped: number; conflicts: number; errors: number; issues: MigrationIssue[] }