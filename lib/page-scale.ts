import type { ServiceBuilderRecord } from '@/lib/service-builder'
import type { AiGenerationJobRecord, CmsStatus } from '@/lib/cms-model'

export type PageListFilters = { page: number; pageSize: number; search?: string; status?: CmsStatus; serviceId?: string; locationId?: string; seoScoreMin?: number; generationStatus?: AiGenerationJobRecord['status']; sort?: 'updatedAt' | 'publishedAt' | 'service' | 'location' }
export type PageListResult<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number }
export type BulkPageCandidate = { serviceId: string; locationId: string; serviceSlug: string; locationSlug: string }
export type BulkPagePlan = { candidates: BulkPageCandidate[]; duplicates: BulkPageCandidate[]; batchCount: number; warnings: string[] }
export type GenerationPlan = { action: string; pageIds: string[]; batchSize: number; jobs: { id: string; servicePageId: string; action: string; inputHash: string; status: 'queued'; attempts: number; maxAttempts: number }[]; skipped: string[] }
export type QualityIssue = { code: string; severity: 'warning' | 'error'; message: string }
export type QualityReport = { score: number; issues: QualityIssue[]; canPublish: boolean }
export type SimilarityCandidate = { pageId: string; serviceId: string; title: string; metaDescription: string; introduction: string; headings: string[]; primaryKeyword: string; fingerprint: string }
export type SimilarityWarning = { pageIds: string[]; reason: string; severity: 'warning' | 'high' }

const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim()
const hash = (value: string) => { let result = 2166136261; for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619); return (result >>> 0).toString(16) }
export const pageFingerprint = (record: Pick<ServiceBuilderRecord, 'pageTitle' | 'shortDescription' | 'hero' | 'about'>) => hash([record.pageTitle, record.shortDescription, record.hero.h1, record.hero.description, record.about.description].map(normalise).join('|'))

export function planBulkPageCreation(serviceId: string, serviceSlug: string, locations: { id: string; slug: string }[], existing: Set<string>, batchSize = 25): BulkPagePlan {
  const candidates = locations.map((location) => ({ serviceId, locationId: location.id, serviceSlug, locationSlug: location.slug }))
  const duplicates = candidates.filter((candidate) => existing.has(`${candidate.serviceId}:${candidate.locationId}`))
  const unique = candidates.filter((candidate) => !existing.has(`${candidate.serviceId}:${candidate.locationId}`))
  return { candidates: unique, duplicates, batchCount: Math.ceil(unique.length / Math.max(1, batchSize)), warnings: locations.length > 1000 ? ['Large batch: review the count and create drafts before queuing AI generation.'] : [] }
}

export function createGenerationPlan(action: string, pageIds: string[], existingJobs: Pick<AiGenerationJobRecord, 'servicePageId' | 'action' | 'status' | 'inputHash'>[], batchSize = 25, inputVersion = '1'): GenerationPlan {
  const existingKeys = new Set(existingJobs.filter((job) => job.status === 'queued' || job.status === 'processing' || job.status === 'completed').map((job) => `${job.servicePageId}:${job.action}:${job.inputHash}`))
  const jobs = pageIds.map((servicePageId) => { const inputHash = hash(`${servicePageId}:${action}:${inputVersion}`); return { id: `job-${hash(`${servicePageId}:${action}:${inputVersion}`)}`, servicePageId, action, inputHash, status: 'queued' as const, attempts: 0, maxAttempts: 3 } }).filter((job) => !existingKeys.has(`${job.servicePageId}:${job.action}:${job.inputHash}`))
  return { action, pageIds, batchSize: Math.max(1, Math.min(batchSize, 100)), jobs, skipped: pageIds.filter((id) => !jobs.some((job) => job.servicePageId === id)) }
}

export function chunk<T>(items: T[], size = 25) { const chunks: T[][] = []; for (let index = 0; index < items.length; index += Math.max(1, size)) chunks.push(items.slice(index, index + Math.max(1, size))); return chunks }

export function qualityCheck(record: ServiceBuilderRecord, researchAvailable: boolean): QualityReport {
  const issues: QualityIssue[] = []; const contentLength = [record.shortDescription, record.hero.description, record.about.description, ...record.benefits.map((item) => item.description), ...record.process.map((item) => item.description)].join(' ').trim().length
  if (!record.hero.h1) issues.push({ code: 'missing-h1', severity: 'error', message: 'H1 is missing.' })
  if (!record.seo.seoTitle) issues.push({ code: 'missing-title', severity: 'error', message: 'SEO title is missing.' })
  if (!record.seo.metaDescription) issues.push({ code: 'missing-meta', severity: 'error', message: 'Meta description is missing.' })
  if (contentLength < 500) issues.push({ code: 'thin-content', severity: 'warning', message: 'Content is too thin for a useful service page.' })
  if (!researchAvailable) issues.push({ code: 'missing-research', severity: 'warning', message: 'Accepted SEO research is not available.' })
  if (record.seo.primaryKeyword && !normalise(record.hero.h1).includes(normalise(record.seo.primaryKeyword))) issues.push({ code: 'intent-keyword', severity: 'warning', message: 'Primary keyword is not naturally reflected in the H1.' })
  const score = Math.max(0, 100 - issues.reduce((total, issue) => total + (issue.severity === 'error' ? 25 : 10), 0))
  return { score, issues, canPublish: !issues.some((issue) => issue.severity === 'error') }
}

export function findDuplicateCandidates(pages: SimilarityCandidate[]): SimilarityWarning[] {
  const warnings: SimilarityWarning[] = []; const byCandidate = new Map<string, SimilarityCandidate[]>()
  for (const page of pages) { const key = `${page.serviceId}:${normalise(page.primaryKeyword)}:${page.fingerprint}`; byCandidate.set(key, [...(byCandidate.get(key) || []), page]) }
  for (const group of byCandidate.values()) if (group.length > 1) warnings.push({ pageIds: group.map((page) => page.pageId), reason: 'Same service, primary keyword and content fingerprint.', severity: 'high' })
  return warnings
}

export function findCannibalizationCandidates(pages: Pick<SimilarityCandidate, 'pageId' | 'serviceId' | 'primaryKeyword' | 'title'>[], intents: Map<string, string>): SimilarityWarning[] {
  const warnings: SimilarityWarning[] = []; const groups = new Map<string, SimilarityCandidate[]>()
  for (const page of pages) { const key = `${page.serviceId}:${normalise(page.primaryKeyword)}:${intents.get(page.pageId) || 'unknown'}`; groups.set(key, [...(groups.get(key) || []), page as SimilarityCandidate]) }
  for (const group of groups.values()) if (group.length > 1) warnings.push({ pageIds: group.map((page) => page.pageId), reason: 'Pages target the same service, primary keyword and search intent. Review location differentiation.', severity: 'warning' })
  return warnings
}

export function sitemapChunks(urls: string[], chunkSize = 50000) { return chunk(urls, chunkSize) }
