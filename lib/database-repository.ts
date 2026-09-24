import 'server-only'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Prisma, PrismaClient } from '@prisma/client'
import type { AiGenerationJobRecord, ContentRevision, FaqRecord, LocationRecord, MediaAssetRecord, ServicePageRecord, SeoMetadataRecord } from '@/lib/cms-model'
import type { ServiceBuilderRecord } from '@/lib/service-builder'
import type { SeoResearchRecord } from '@/lib/seo-research'
import type { ContentRepository } from '@/lib/content-repository'
import type { PageSummary, ScalableContentRepository } from '@/lib/scalable-repository'
import type { PageListFilters, PageListResult } from '@/lib/page-scale'
import type { CmsPage } from '@/lib/page-cms'
import type { CmsSection } from '@/lib/cms-sections'
import type { ContentPlan } from '@/lib/content-plan'
import { prisma as defaultPrisma } from '@/lib/prisma'

const asJson = (value: unknown) => value as Prisma.InputJsonValue
const statusToDb = (status: 'draft' | 'published' | 'unpublished' | 'archived') => status === 'archived' ? 'UNPUBLISHED' : status.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'
const statusFromDb = (status: string) => status.toLowerCase() as 'draft' | 'published' | 'unpublished'
const serviceStatusFromDb = (status: string, visible = true) => status === 'PUBLISHED' ? 'published' as const : visible ? 'draft' as const : 'archived' as const
type ServicePagePayload = { published: ServiceBuilderRecord; draft?: ServiceBuilderRecord }

const servicePagePayload = (content: unknown): ServicePagePayload => {
  if (content && typeof content === 'object' && 'published' in content && (content as { published?: unknown }).published) return content as ServicePagePayload
  return { published: content as ServiceBuilderRecord }
}

const validateServiceIdentity = (record: ServiceBuilderRecord) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) || record.slug !== record.serviceSlug) throw new Error('Service URL slug cannot be changed or is invalid.')
  if (record.seo.canonicalUrl && !record.seo.canonicalUrl.startsWith('/') && !/^https?:\/\//.test(record.seo.canonicalUrl)) throw new Error('Canonical URL must be a site path or absolute HTTP(S) URL.')
}

const contentOf = (page: { content: unknown; service: { id: string; name: string; slug: string; category: string; description: string; displayOrder: number; visible: boolean; status: string } }, includeDraft = false) => {
  const payload = servicePagePayload(page.content)
  const content = (includeDraft && payload.draft ? payload.draft : payload.published)
  return { ...content, id: page.service.id, serviceSlug: page.service.slug, serviceName: page.service.name, pageTitle: content.pageTitle || page.service.name, slug: content.slug || page.service.slug, shortDescription: content.shortDescription || page.service.description, status: includeDraft && payload.draft ? 'draft' as const : serviceStatusFromDb(page.service.status, page.service.visible), visibility: page.service.visible ? 'visible' as const : 'hidden' as const, displayOrder: page.service.displayOrder, quickInfo: { ...content.quickInfo, serviceType: page.service.category || content.quickInfo.serviceType } }
}

export class DatabaseContentRepository implements ContentRepository, ScalableContentRepository {
  constructor(private readonly db: PrismaClient = defaultPrisma) {}

  async getService(slug: string) {
    const page = await this.db.servicePage.findFirst({ where: { service: { slug }, locationId: null }, include: { service: true }, orderBy: { updatedAt: 'desc' } })
    return page ? contentOf(page) : null
  }

  async getServices() {
    const pages = await this.db.servicePage.findMany({ where: { locationId: null }, include: { service: true }, orderBy: [{ service: { displayOrder: 'asc' } }, { updatedAt: 'desc' }] })
    return pages.map((page) => contentOf(page, true))
  }

  async createService(record: ServiceBuilderRecord) {
    await this.db.$transaction(async (tx) => {
      const service = await tx.service.create({ data: { id: record.id, name: record.serviceName, slug: record.serviceSlug, category: record.quickInfo.serviceType, description: record.shortDescription, icon: record.icon || '', displayOrder: record.displayOrder || 0, visible: record.visibility !== 'hidden', status: statusToDb(record.status) } })
      await tx.servicePage.create({ data: { id: `page-${record.serviceSlug}`, serviceId: service.id, content: asJson(record), status: statusToDb(record.status), version: 1 } })
    })
    return record
  }

  async saveService(record: ServiceBuilderRecord) { await this.updateService(record) }

  async updateService(record: ServiceBuilderRecord) {
    validateServiceIdentity(record)
    const page = await this.db.servicePage.findFirst({ where: { service: { slug: record.serviceSlug }, locationId: null }, include: { service: true } })
    if (!page) throw new Error(`Service page not found: ${record.serviceSlug}`)
    const payload = servicePagePayload(page.content)
    const draft = { ...record, status: 'draft' as const, updatedAt: new Date().toISOString() }
    await this.db.servicePage.update({ where: { id: page.id }, data: { content: asJson({ ...payload, draft }) } })
    return draft
  }

  async publishService(slug: string) {
    return this.db.$transaction(async (tx) => {
      const page = await tx.servicePage.findFirst({ where: { service: { slug }, locationId: null }, include: { service: true } })
      if (!page) throw new Error(`Service page not found: ${slug}`)
      const payload = servicePagePayload(page.content)
      if (!payload.draft) throw new Error('Save a draft before publishing changes.')
      validateServiceIdentity(payload.draft)
      const published = { ...payload.draft, status: 'published' as const, updatedAt: new Date().toISOString() }
      const nextVersion = page.version + 1
      await tx.contentRevision.create({ data: { id: crypto.randomUUID(), servicePageId: page.id, version: nextVersion, content: asJson(payload.published), changedBy: 'admin', changeType: 'PUBLISH', status: 'PUBLISHED' } })
      await tx.service.update({ where: { id: page.serviceId }, data: { name: published.serviceName, category: published.quickInfo.serviceType, description: published.shortDescription, icon: published.icon || '', displayOrder: published.displayOrder || 0, visible: published.visibility !== 'hidden', status: 'PUBLISHED' } })
      await tx.servicePage.update({ where: { id: page.id }, data: { content: asJson({ published }), status: 'PUBLISHED', version: nextVersion, publishedAt: new Date() } })
      return published
    })
  }

  async listServiceRevisions(slug: string) {
    const page = await this.db.servicePage.findFirst({ where: { service: { slug }, locationId: null }, select: { id: true } })
    if (!page) throw new Error(`Service page not found: ${slug}`)
    return this.db.contentRevision.findMany({ where: { servicePageId: page.id }, orderBy: { version: 'desc' } })
  }

  async restoreServiceRevision(slug: string, revisionId: string) {
    return this.db.$transaction(async (tx) => {
      const page = await tx.servicePage.findFirst({ where: { service: { slug }, locationId: null }, include: { service: true } })
      if (!page) throw new Error(`Service page not found: ${slug}`)
      const revision = await tx.contentRevision.findFirst({ where: { id: revisionId, servicePageId: page.id } })
      if (!revision || !revision.content || typeof revision.content !== 'object') throw new Error('Revision not found.')
      const restored = revision.content as unknown as ServiceBuilderRecord
      validateServiceIdentity(restored)
      const current = servicePagePayload(page.content).published
      const nextVersion = page.version + 1
      await tx.contentRevision.create({ data: { id: crypto.randomUUID(), servicePageId: page.id, version: nextVersion, content: asJson(current), changedBy: 'admin', changeType: 'RESTORE', status: 'PUBLISHED' } })
      await tx.servicePage.update({ where: { id: page.id }, data: { content: asJson({ published: restored }), status: 'PUBLISHED', version: nextVersion, publishedAt: new Date() } })
      return restored
    })
  }

  async deleteService(slug: string) { await this.db.service.delete({ where: { slug } }) }

  async getServicePage(serviceSlug: string, locationSlug?: string) {
    const page = await this.db.servicePage.findFirst({ where: { service: { slug: serviceSlug }, location: locationSlug ? { slug: locationSlug } : null }, include: { service: true } })
    if (!page) return null
    return { id: page.id, serviceId: page.serviceId, locationId: page.locationId, content: contentOf(page), status: statusFromDb(page.status), version: page.version, createdAt: page.createdAt.toISOString(), updatedAt: page.updatedAt.toISOString(), publishedAt: page.publishedAt?.toISOString() || null }
  }

  async listCmsPages(filters: { status?: string; search?: string } = {}) {
    const where: Prisma.ServicePageWhereInput = { ...(filters.status ? { status: statusToDb(filters.status as 'draft' | 'published' | 'unpublished' | 'archived') } : {}), ...(filters.search ? { content: { path: ['title'], string_contains: filters.search } } : {}) }
    const rows = await this.db.servicePage.findMany({ where, orderBy: { updatedAt: 'desc' } })
    return rows.map((row) => row.content as CmsPage)
  }

  async getCmsPage(id: string) {
    const row = await this.db.servicePage.findUnique({ where: { id } })
    return row ? row.content as CmsPage : null
  }

  async saveCmsPage(page: CmsPage) {
    const status = statusToDb(page.status === 'published' ? 'published' : page.status === 'archived' ? 'archived' : 'draft')
    const service = page.serviceId ? await this.db.service.findFirst({ where: { OR: [{ id: page.serviceId }, { slug: page.serviceId }] } }) : null
    if (!service) throw new Error(`Service is required before saving page ${page.id}.`)
    const saved = await this.db.servicePage.upsert({ where: { id: page.id }, create: { id: page.id, serviceId: service.id, content: asJson(page), status, version: 1, createdAt: new Date(page.createdAt), updatedAt: new Date(page.updatedAt), publishedAt: page.status === 'published' ? new Date(page.publishedAt || page.updatedAt) : null }, update: { content: asJson(page), status, version: { increment: 1 }, publishedAt: page.status === 'published' ? new Date(page.publishedAt || page.updatedAt) : null } })
    return { ...page, updatedAt: saved.updatedAt.toISOString() }
  }

  async archiveCmsPage(id: string) {
    const page = await this.getCmsPage(id)
    if (!page) throw new Error('Page not found.')
    return this.saveCmsPage({ ...page, status: 'archived', robotsIndex: false, sitemap: { ...page.sitemap, include: false }, updatedAt: new Date().toISOString() })
  }

  async listSections(pageId: string) { return (await this.db.cmsSection.findMany({ where: { servicePageId: pageId }, orderBy: { displayOrder: 'asc' } })).map((row) => row.sectionData as CmsSection) }
  async saveSectionsDb(pageId: string, sections: CmsSection[]) { await this.db.$transaction(async (tx) => { await tx.cmsSection.deleteMany({ where: { servicePageId: pageId } }); if (sections.length) await tx.cmsSection.createMany({ data: sections.map((section, index) => ({ id: section.id, servicePageId: pageId, sectionData: asJson({ ...section, order: index + 1 }), displayOrder: index + 1, source: section.source || 'manual', status: section.status === 'published' ? 'PUBLISHED' : 'DRAFT' })) }) }); return sections }
  async savePageRevisionDb(page: CmsPage, sections: CmsSection[], changeType: 'CREATE' | 'EDIT' | 'AI_ACCEPT' | 'PUBLISH' | 'UNPUBLISH' | 'RESTORE') { const row = await this.db.servicePage.findUnique({ where: { id: page.id }, select: { version: true } }); if (!row) throw new Error('Page not found.'); return this.db.contentRevision.create({ data: { id: crypto.randomUUID(), servicePageId: page.id, version: row.version, content: asJson({ page, sections }), changedBy: 'admin', changeType, status: statusToDb(page.status === 'published' ? 'published' : page.status === 'archived' ? 'archived' : 'draft'), } }) }

  async listBlogs() { return this.db.blogPost.findMany({ orderBy: { updatedAt: 'desc' } }) }
  async saveBlog(input: { id?: string; slug: string; title: string; content: unknown; status?: 'draft' | 'published' | 'unpublished' }) { const status = statusToDb(input.status || 'draft'); return this.db.blogPost.upsert({ where: { id: input.id || crypto.randomUUID() }, create: { id: input.id || crypto.randomUUID(), slug: input.slug, title: input.title, content: asJson(input.content), status, publishedAt: status === 'PUBLISHED' ? new Date() : null }, update: { slug: input.slug, title: input.title, content: asJson(input.content), status, publishedAt: status === 'PUBLISHED' ? new Date() : null } }) }
  async listContentPlans() { return this.db.contentPlan.findMany({ orderBy: { updatedAt: 'desc' } }) }
  async saveContentPlan(plan: ContentPlan) { return this.db.contentPlan.upsert({ where: { id: plan.id }, create: { id: plan.id, title: plan.title, slug: plan.slug, pageType: plan.pageType, serviceId: plan.serviceId || null, stateId: plan.stateId || null, cityId: plan.cityId || null, status: statusToDb(plan.status === 'planned' ? 'draft' : plan.status === 'published' ? 'published' : 'unpublished'), planData: asJson(plan) }, update: { title: plan.title, slug: plan.slug, pageType: plan.pageType, serviceId: plan.serviceId || null, stateId: plan.stateId || null, cityId: plan.cityId || null, status: statusToDb(plan.status === 'planned' ? 'draft' : plan.status === 'published' ? 'published' : 'unpublished'), planData: asJson(plan) } }) }

  async createServicePage(page: ServicePageRecord) {
    const created = await this.db.servicePage.create({ data: { id: page.id, serviceId: page.serviceId, locationId: page.locationId, content: asJson(page.content), status: statusToDb(page.status), version: page.version, createdAt: new Date(page.createdAt), updatedAt: new Date(page.updatedAt), publishedAt: page.publishedAt ? new Date(page.publishedAt) : null } })
    return { ...page, id: created.id }
  }

  async updateServicePage(page: ServicePageRecord) {
    const updated = await this.db.servicePage.update({ where: { id: page.id }, data: { content: asJson(page.content), status: statusToDb(page.status), version: page.version, publishedAt: page.publishedAt ? new Date(page.publishedAt) : null } })
    return { ...page, updatedAt: updated.updatedAt.toISOString() }
  }

  async saveResearch(research: SeoResearchRecord) {
    const page = await this.db.servicePage.findFirst({ where: { service: { slug: research.serviceSlug }, locationId: null } })
    if (!page) throw new Error(`Service page not found: ${research.serviceSlug}`)
    await this.db.seoResearch.create({ data: { servicePageId: page.id, researchData: asJson(research), researchMode: research.researchMode, researchedAt: new Date(research.researchedAt) } })
  }

  async getResearch(slug: string) {
    const item = await this.db.seoResearch.findFirst({ where: { servicePage: { service: { slug }, locationId: null } }, orderBy: { researchedAt: 'desc' } })
    return item ? item.researchData as unknown as SeoResearchRecord : null
  }

  async getSeoResearch(servicePageId: string) {
    const item = await this.db.seoResearch.findFirst({ where: { servicePageId }, orderBy: { researchedAt: 'desc' } })
    return item ? item.researchData as unknown as SeoResearchRecord : null
  }

  async getRevisions(servicePageId: string) {
    const rows = await this.db.contentRevision.findMany({ where: { servicePageId }, orderBy: { version: 'desc' } })
    return rows.map((row) => ({ id: row.id, servicePageId: row.servicePageId, version: row.version, content: row.content as Partial<ServiceBuilderRecord>, changedBy: row.changedBy, changeType: row.changeType.toLowerCase().replace('_', '-') as ContentRevision['changeType'], status: statusFromDb(row.status), createdAt: row.createdAt.toISOString() }))
  }

  async saveVersion(revision: ContentRevision) { await this.createRevision(revision) }

  async createRevision(revision: ContentRevision) {
    await this.db.contentRevision.create({ data: { id: revision.id, servicePageId: revision.servicePageId, version: revision.version, content: asJson(revision.content), changedBy: revision.changedBy, changeType: revision.changeType.toUpperCase().replace('-', '_') as 'CREATE' | 'EDIT' | 'AI_ACCEPT' | 'PUBLISH' | 'UNPUBLISH' | 'RESTORE', status: statusToDb(revision.status), createdAt: new Date(revision.createdAt) } })
    return revision
  }

  async publishPage(slug: string) { await this.setPublication(slug, 'PUBLISHED') }
  async unpublishPage(slug: string) { await this.setPublication(slug, 'UNPUBLISHED') }
  async publish(slug: string) { await this.publishPage(slug) }

  private async setPublication(slug: string, status: 'PUBLISHED' | 'UNPUBLISHED') {
    await this.db.$transaction(async (tx) => {
      const page = await tx.servicePage.findFirst({ where: { service: { slug }, locationId: null } })
      if (!page) throw new Error(`Service page not found: ${slug}`)
      const nextVersion = page.version + 1
      await tx.contentRevision.create({ data: { servicePageId: page.id, version: nextVersion, content: page.content as Prisma.InputJsonValue, changedBy: 'server', changeType: status === 'PUBLISHED' ? 'PUBLISH' : 'UNPUBLISH', status, } })
      await tx.servicePage.update({ where: { id: page.id }, data: { status, version: nextVersion, publishedAt: status === 'PUBLISHED' ? new Date() : null } })
    })
  }

  async getMetadata(servicePageId: string) { return this.db.seoMetadata.findUnique({ where: { servicePageId } }) as unknown as Promise<SeoMetadataRecord | null> }
  async saveMetadata(metadata: SeoMetadataRecord) { await this.db.seoMetadata.upsert({ where: { servicePageId: metadata.servicePageId }, create: { ...metadata }, update: { title: metadata.title, description: metadata.description, canonical: metadata.canonical, robots: metadata.robots, ogTitle: metadata.ogTitle, ogDescription: metadata.ogDescription, primaryKeyword: metadata.primaryKeyword } }) }
  async getFaqs(servicePageId: string) { return this.db.faq.findMany({ where: { servicePageId }, orderBy: { sortOrder: 'asc' } }) as unknown as Promise<FaqRecord[]> }
  async getLocations() { return (await this.db.location.findMany({ orderBy: { city: 'asc' } })).map((item) => ({ id: item.id, country: item.country, state: item.state, city: item.city, slug: item.slug, status: statusFromDb(item.status), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })) as LocationRecord[] }
  async saveLocation(location: LocationRecord) { await this.db.location.upsert({ where: { id: location.id }, create: { ...location, status: statusToDb(location.status), createdAt: new Date(location.createdAt), updatedAt: new Date(location.updatedAt) }, update: { country: location.country, state: location.state, city: location.city, slug: location.slug, status: statusToDb(location.status) } }) }
  async getMedia() { return this.db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } }) as unknown as Promise<MediaAssetRecord[]> }
  async createMedia(media: MediaAssetRecord) { return this.db.mediaAsset.create({ data: { ...media, width: media.width ?? undefined, height: media.height ?? undefined, createdAt: new Date(media.createdAt) } }) as unknown as Promise<MediaAssetRecord> }

  async listPages(filters: PageListFilters): Promise<PageListResult<PageSummary>> {
    const page = Math.max(1, filters.page); const pageSize = Math.min(100, Math.max(1, filters.pageSize));
    const where: Prisma.ServicePageWhereInput = { ...(filters.status ? { status: statusToDb(filters.status) } : {}), ...(filters.serviceId ? { serviceId: filters.serviceId } : {}), ...(filters.locationId ? { locationId: filters.locationId } : {}), ...(filters.search ? { OR: [{ content: { path: ['serviceName'], string_contains: filters.search } }, { service: { slug: { contains: filters.search, mode: 'insensitive' } } }, { location: { slug: { contains: filters.search, mode: 'insensitive' } } }] } : {}) }
    const [total, rows] = await this.db.$transaction([this.db.servicePage.count({ where }), this.db.servicePage.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { updatedAt: 'desc' }, select: { id: true, serviceId: true, locationId: true, status: true, version: true, updatedAt: true, publishedAt: true, service: { select: { slug: true } }, location: { select: { slug: true } } } })])
    return { items: rows.map((row) => ({ id: row.id, serviceId: row.serviceId, locationId: row.locationId, serviceSlug: row.service.slug, locationSlug: row.location?.slug || null, status: statusFromDb(row.status), version: row.version, updatedAt: row.updatedAt.toISOString(), publishedAt: row.publishedAt?.toISOString() || null })), page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  }

  async createPageBatch(pages: ServicePageRecord[]) {
    let created = 0; let skipped = 0; const conflicts: string[] = []
    for (const page of pages) { try { await this.createServicePage(page); created += 1 } catch (error) { skipped += 1; conflicts.push(error instanceof Error ? error.message : page.id) } }
    return { created, skipped, conflicts }
  }

  async createGenerationJobs(jobs: Pick<AiGenerationJobRecord, 'id' | 'servicePageId' | 'action' | 'inputHash' | 'maxAttempts'>[]) {
    let created = 0; let skipped = 0
    for (const job of jobs) { try { await this.db.aiGenerationJob.create({ data: { id: job.id, servicePageId: job.servicePageId, action: job.action, inputHash: job.inputHash, maxAttempts: job.maxAttempts } }); created += 1 } catch { skipped += 1 } }
    return { created, skipped }
  }

  async listGenerationJobs(filters: { status?: AiGenerationJobRecord['status']; page?: number; pageSize?: number } = {}): Promise<PageListResult<AiGenerationJobRecord>> {
    const page = Math.max(1, filters.page || 1); const pageSize = Math.min(100, Math.max(1, filters.pageSize || 25)); const where = filters.status ? { status: filters.status.toUpperCase() as 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' } : undefined
    const [total, rows] = await this.db.$transaction([this.db.aiGenerationJob.count({ where }), this.db.aiGenerationJob.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } })])
    return { items: rows.map((row) => ({ id: row.id, servicePageId: row.servicePageId, action: row.action, status: row.status.toLowerCase() as AiGenerationJobRecord['status'], attempts: row.attempts, maxAttempts: row.maxAttempts, errorMessage: row.errorMessage, inputHash: row.inputHash, tokenCount: row.tokenCount, estimatedCost: row.estimatedCost ? Number(row.estimatedCost) : null, startedAt: row.startedAt?.toISOString() || null, completedAt: row.completedAt?.toISOString() || null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })), page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  }

  async updateGenerationJob(id: string, update: Partial<Pick<AiGenerationJobRecord, 'status' | 'attempts' | 'errorMessage' | 'startedAt' | 'completedAt' | 'tokenCount' | 'estimatedCost'>>) {
    const row = await this.db.aiGenerationJob.update({ where: { id }, data: { ...(update.status ? { status: update.status.toUpperCase() as 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' } : {}), ...(update.attempts === undefined ? {} : { attempts: update.attempts }), ...(update.errorMessage === undefined ? {} : { errorMessage: update.errorMessage }), ...(update.startedAt === undefined ? {} : { startedAt: update.startedAt ? new Date(update.startedAt) : null }), ...(update.completedAt === undefined ? {} : { completedAt: update.completedAt ? new Date(update.completedAt) : null }), ...(update.tokenCount === undefined ? {} : { tokenCount: update.tokenCount }), ...(update.estimatedCost === undefined ? {} : { estimatedCost: update.estimatedCost }) } })
    return { id: row.id, servicePageId: row.servicePageId, action: row.action, status: row.status.toLowerCase() as AiGenerationJobRecord['status'], attempts: row.attempts, maxAttempts: row.maxAttempts, errorMessage: row.errorMessage, inputHash: row.inputHash, tokenCount: row.tokenCount, estimatedCost: row.estimatedCost ? Number(row.estimatedCost) : null, startedAt: row.startedAt?.toISOString() || null, completedAt: row.completedAt?.toISOString() || null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }
  }

  async cancelGenerationJobs(ids: string[]) { const result = await this.db.aiGenerationJob.updateMany({ where: { id: { in: ids }, status: { in: ['QUEUED', 'PROCESSING'] } }, data: { status: 'CANCELLED' } }); return result.count }
}

const blogStoreFile = path.join(process.cwd(), '.local', 'blog-posts.json')

type BlogRecord = {
  id: string
  slug: string
  title: string
  content: unknown
  status: 'draft' | 'published' | 'unpublished'
  publishedAt?: string | null
  updatedAt?: string
  createdAt?: string
}

async function readBlogStore(): Promise<Record<string, BlogRecord>> {
  try {
    const raw = JSON.parse(await readFile(blogStoreFile, 'utf8'))
    return raw && typeof raw === 'object' ? (raw as Record<string, BlogRecord>) : {}
  } catch {
    return {}
  }
}

async function writeBlogStore(records: Record<string, BlogRecord>) {
  await mkdir(path.dirname(blogStoreFile), { recursive: true })
  await writeFile(blogStoreFile, JSON.stringify(records, null, 2), 'utf8')
}

export async function listPublishedBlogs() {
  if (process.env.DATABASE_URL) {
    const rows = await createProductionRepository().listBlogs()
    return rows.filter((row) => String(row.status).toLowerCase() === 'published').map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      content: row.content,
      status: 'published' as const,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      updatedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }))
  }

  if (process.env.NODE_ENV !== 'development') return []
  const store = await readBlogStore()
  return Object.values(store)
    .filter((row) => String(row.status).toLowerCase() === 'published')
    .sort((a, b) => new Date(b.updatedAt || b.publishedAt || 0).getTime() - new Date(a.updatedAt || a.publishedAt || 0).getTime())
}

export async function getBlogBySlug(slug: string) {
  if (process.env.DATABASE_URL) {
    const rows = await createProductionRepository().listBlogs()
    return rows.find((row) => row.slug === slug) || null
  }

  if (process.env.NODE_ENV !== 'development') return null
  const store = await readBlogStore()
  const entry = Object.values(store).find((row) => row.slug === slug)
  return entry || null
}

export async function saveBlogServer(input: { id?: string; slug: string; title: string; content: unknown; status?: 'draft' | 'published' | 'unpublished' }) {
  if (process.env.DATABASE_URL) return createProductionRepository().saveBlog(input)
  if (process.env.NODE_ENV !== 'development') throw new Error('DATABASE_URL is required for production blog storage.')

  const store = await readBlogStore()
  const id = input.id || crypto.randomUUID()
  const status = input.status || 'draft'
  const record: BlogRecord = {
    id,
    slug: input.slug,
    title: input.title,
    content: input.content,
    status,
    publishedAt: status === 'published' ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  const next = { ...store }
  for (const [key, value] of Object.entries(next)) {
    if (value.slug === record.slug && key !== id) delete next[key]
  }
  next[id] = record
  await writeBlogStore(next)
  return record
}

export function createProductionRepository() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for the production repository; localStorage fallback is disabled.')
  return new DatabaseContentRepository()
}
