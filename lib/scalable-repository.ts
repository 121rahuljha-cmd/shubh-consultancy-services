import type { AiGenerationJobRecord, CmsStatus } from '@/lib/cms-model'
import type { PageListFilters, PageListResult } from '@/lib/page-scale'
import type { ServicePageRecord } from '@/lib/cms-model'

export type PageSummary = { id: string; serviceId: string; locationId: string | null; serviceSlug: string; locationSlug: string | null; status: CmsStatus; version: number; updatedAt: string; publishedAt: string | null }
export type ScalableContentRepository = {
  listPages(filters: PageListFilters): Promise<PageListResult<PageSummary>>
  createPageBatch(pages: ServicePageRecord[]): Promise<{ created: number; skipped: number; conflicts: string[] }>
  createGenerationJobs(jobs: Pick<AiGenerationJobRecord, 'id' | 'servicePageId' | 'action' | 'inputHash' | 'maxAttempts'>[]): Promise<{ created: number; skipped: number }>
  listGenerationJobs(filters?: { status?: AiGenerationJobRecord['status']; page?: number; pageSize?: number }): Promise<PageListResult<AiGenerationJobRecord>>
  updateGenerationJob(id: string, update: Partial<Pick<AiGenerationJobRecord, 'status' | 'attempts' | 'errorMessage' | 'startedAt' | 'completedAt' | 'tokenCount' | 'estimatedCost'>>): Promise<AiGenerationJobRecord>
  cancelGenerationJobs(ids: string[]): Promise<number>
}
