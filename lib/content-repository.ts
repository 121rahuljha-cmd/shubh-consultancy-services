import type { ServiceBuilderRecord } from '@/lib/service-builder'
import type { SeoResearchRecord } from '@/lib/seo-research'
import type { ContentRevision, FaqRecord, LocationRecord, MediaAssetRecord, ServicePageRecord, ServiceRecord, SeoMetadataRecord } from '@/lib/cms-model'

export interface ContentRepository {
  getService(slug: string): ServiceBuilderRecord | null | Promise<ServiceBuilderRecord | null>
  getServices(): ServiceBuilderRecord[] | Promise<ServiceBuilderRecord[]>
  createService(record: ServiceBuilderRecord): ServiceBuilderRecord | Promise<ServiceBuilderRecord>
  saveService(record: ServiceBuilderRecord): void | Promise<void>
  updateService(record: ServiceBuilderRecord): ServiceBuilderRecord | Promise<ServiceBuilderRecord>
  deleteService(slug: string): void | Promise<void>
  getServicePage(serviceSlug: string, locationSlug?: string): ServicePageRecord | null | Promise<ServicePageRecord | null>
  createServicePage(page: ServicePageRecord): ServicePageRecord | Promise<ServicePageRecord>
  updateServicePage(page: ServicePageRecord): ServicePageRecord | Promise<ServicePageRecord>
  saveResearch(research: SeoResearchRecord): void | Promise<void>
  getResearch(slug: string): SeoResearchRecord | null | Promise<SeoResearchRecord | null>
  getSeoResearch(servicePageId: string): SeoResearchRecord | null | Promise<SeoResearchRecord | null>
  getRevisions(servicePageId: string): ContentRevision[] | Promise<ContentRevision[]>
  saveVersion(revision: ContentRevision): void | Promise<void>
  createRevision(revision: ContentRevision): ContentRevision | Promise<ContentRevision>
  publishPage(serviceSlug: string): void | Promise<void>
  unpublishPage(serviceSlug: string): void | Promise<void>
  publish(slug: string): void | Promise<void>
  getMetadata(servicePageId: string): SeoMetadataRecord | null | Promise<SeoMetadataRecord | null>
  saveMetadata(metadata: SeoMetadataRecord): void | Promise<void>
  getFaqs(servicePageId: string): FaqRecord[] | Promise<FaqRecord[]>
  getLocations(): LocationRecord[] | Promise<LocationRecord[]>
  saveLocation(location: LocationRecord): void | Promise<void>
  getMedia(): MediaAssetRecord[] | Promise<MediaAssetRecord[]>
  createMedia(media: MediaAssetRecord): MediaAssetRecord | Promise<MediaAssetRecord>
}

export function createLocalStorageRepository(): ContentRepository {
  const serviceKey = 'scs-service-builder'
  const researchKey = (slug: string) => `scs-seo-research-${slug}`
  const revisionKey = (slug: string) => `scs-content-revisions-${slug}`
  const readRecords = () => { try { return JSON.parse(window.localStorage.getItem(serviceKey) || '[]') as ServiceBuilderRecord[] } catch { return [] } }
  const writeRecords = (records: ServiceBuilderRecord[]) => window.localStorage.setItem(serviceKey, JSON.stringify(records))
  const find = (slug: string) => readRecords().find((record) => record.serviceSlug === slug) || null
  const revisions = (slug: string) => { try { return JSON.parse(window.localStorage.getItem(revisionKey(slug)) || '[]') as ContentRevision[] } catch { return [] } }
  return {
    getService: (slug) => find(slug),
    getServices: () => readRecords(),
    createService: (record) => { const records = readRecords(); if (records.some((item) => item.serviceSlug === record.serviceSlug)) throw new Error(`Service already exists: ${record.serviceSlug}`); writeRecords([...records, record]); return record },
    saveService: (record) => { const records = readRecords(); writeRecords(records.some((item) => item.serviceSlug === record.serviceSlug) ? records.map((item) => item.serviceSlug === record.serviceSlug ? record : item) : [...records, record]) },
    updateService: (record) => { const existing = find(record.serviceSlug); if (!existing) throw new Error(`Service not found: ${record.serviceSlug}`); const next = { ...record, updatedAt: new Date().toISOString() }; writeRecords(readRecords().map((item) => item.serviceSlug === record.serviceSlug ? next : item)); return next },
    deleteService: (slug) => writeRecords(readRecords().filter((record) => record.serviceSlug !== slug)),
    getServicePage: (slug) => { const record = find(slug); return record ? { id: `page-${slug}`, serviceId: `service-${slug}`, locationId: null, content: record, status: record.status === 'published' ? 'published' : 'draft', version: revisions(slug).length || 1, createdAt: record.updatedAt, updatedAt: record.updatedAt, publishedAt: record.status === 'published' ? record.updatedAt : null } : null },
    createServicePage: (page) => { if (find(page.content.serviceSlug)) throw new Error(`Service page already exists: ${page.content.serviceSlug}`); writeRecords([...readRecords(), page.content]); return page },
    updateServicePage: (page) => { const next = { ...page, updatedAt: new Date().toISOString() }; writeRecords(readRecords().map((item) => item.serviceSlug === page.content.serviceSlug ? page.content : item)); return next },
    saveResearch: (research) => window.localStorage.setItem(researchKey(research.serviceSlug), JSON.stringify(research)),
    getResearch: (slug) => { try { const value = window.localStorage.getItem(researchKey(slug)); return value ? JSON.parse(value) as SeoResearchRecord : null } catch { return null } },
    getSeoResearch: (servicePageId) => { const slug = servicePageId.replace(/^page-/, ''); return find(slug) ? (JSON.parse(window.localStorage.getItem(researchKey(slug)) || 'null') as SeoResearchRecord | null) : null },
    getRevisions: (servicePageId) => revisions(servicePageId.replace(/^page-/, '')),
    saveVersion: (revision) => { const slug = revision.servicePageId.replace(/^page-/, ''); window.localStorage.setItem(revisionKey(slug), JSON.stringify([...revisions(slug), revision])) },
    createRevision: (revision) => { const next = { ...revision, id: revision.id || `revision-${Date.now()}` }; const slug = revision.servicePageId.replace(/^page-/, ''); window.localStorage.setItem(revisionKey(slug), JSON.stringify([...revisions(slug), next])); return next },
    publishPage: (slug) => { const record = find(slug); if (record) writeRecords(readRecords().map((item) => item.serviceSlug === slug ? { ...item, status: 'published' as const, updatedAt: new Date().toISOString() } : item)) },
    unpublishPage: (slug) => { const record = find(slug); if (record) writeRecords(readRecords().map((item) => item.serviceSlug === slug ? { ...item, status: 'draft' as const, updatedAt: new Date().toISOString() } : item)) },
    publish: (slug) => { const record = find(slug); if (record) writeRecords(readRecords().map((item) => item.serviceSlug === slug ? { ...item, status: 'published' as const } : item)) },
    getMetadata: () => null,
    saveMetadata: () => undefined,
    getFaqs: () => [],
    getLocations: () => [],
    saveLocation: () => undefined,
    getMedia: () => [],
    createMedia: (media) => media,
  }
}

export type DatabaseRepositoryFactory = (config: { databaseUrl: string; provider: string }) => ContentRepository
export function createDatabaseContentRepository(): never { throw new Error('Database repository is not enabled. Select a server database and runtime before deployment.') }