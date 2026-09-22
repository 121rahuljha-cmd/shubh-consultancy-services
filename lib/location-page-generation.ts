import type { AiSuggestion } from '@/lib/ai/provider'
import { cmsPageFromAi } from '@/lib/ai/cms-integration'
import { type CmsPage } from '@/lib/page-cms'
import { type CmsSection } from '@/lib/cms-sections'
import type { ServiceBuilderRecord } from '@/lib/service-builder'

export function applyLocationAiDraft(planned: CmsPage, record: ServiceBuilderRecord, suggestion: AiSuggestion): { page: CmsPage; sections: CmsSection[] } {
  const result = cmsPageFromAi(record, suggestion, { pageType: planned.pageType, targetAudience: planned.targetAudience, searchIntent: planned.searchIntent })
  const page: CmsPage = {
    ...result.page,
    id: planned.id,
    title: planned.title,
    slug: planned.slug,
    serviceId: planned.serviceId,
    stateId: planned.stateId,
    cityId: planned.cityId,
    pageType: planned.pageType,
    status: 'draft',
    generationStatus: 'generated',
    seoStatus: 'warning',
    primaryKeyword: planned.primaryKeyword,
    targetAudience: planned.targetAudience,
    targetLocation: planned.targetLocation,
    seoTitle: planned.seoTitle,
    metaDescription: planned.metaDescription,
    canonicalUrl: planned.canonicalUrl,
    h1: result.page.h1 || planned.title,
    breadcrumbs: planned.breadcrumbs,
    robotsIndex: false,
    robotsFollow: true,
    sitemap: { ...planned.sitemap, include: false },
    indexingStatus: 'AI GENERATED — noindex until editorial review',
    updatedAt: new Date().toISOString(),
  }
  return { page, sections: result.sections.map((section) => ({ ...section, pageId: planned.id })) }
}
