import type { AiSuggestion } from '@/lib/ai/provider'
import type { ServiceBuilderRecord } from '@/lib/service-builder'
import { createEmptyPage, type CmsPage } from '@/lib/page-cms'
import { makeSection, type CmsSection, type SectionType } from '@/lib/cms-sections'

const section = (pageId: string, type: SectionType, heading: string, content = ''): CmsSection => ({ ...makeSection(pageId, type), title: heading, heading, content, source: 'ai_generated' })

export function cmsPageFromAi(record: ServiceBuilderRecord, suggestion: AiSuggestion, overrides: Partial<Pick<CmsPage, 'pageType' | 'categoryId' | 'targetAudience' | 'searchIntent'>> = {}): { page: CmsPage; sections: CmsSection[] } {
  const page = createEmptyPage()
  const changes = suggestion.changes
  const pageId = `ai-page-${record.serviceSlug}-${Date.now()}`
  const seo = changes.seo || record.seo
  const hero = changes.hero || record.hero
  const about = changes.about || record.about
  const merged = { ...record, ...changes }
  page.id = pageId
  page.title = merged.pageTitle || merged.serviceName
  page.slug = merged.slug || merged.serviceSlug
  page.pageType = overrides.pageType || 'service'
  page.categoryId = overrides.categoryId || ''
  page.status = 'draft'
  page.serviceId = merged.serviceSlug
  page.primaryKeyword = seo.primaryKeyword
  page.secondaryKeywords = seo.secondaryKeywords
  page.searchIntent = overrides.searchIntent || 'commercial'
  page.targetAudience = overrides.targetAudience || 'Indian business owners'
  page.seoTitle = seo.seoTitle
  page.metaDescription = seo.metaDescription
  page.canonicalUrl = seo.canonicalUrl
  page.robotsIndex = seo.robots.startsWith('index')
  page.robotsFollow = seo.robots.endsWith('follow')
  page.ogTitle = seo.ogTitle
  page.ogDescription = seo.ogDescription
  page.ogImage = seo.ogImage
  page.h1 = hero.h1 || merged.serviceName
  page.introduction = hero.description || merged.shortDescription
  page.overview = about.description
  page.serviceContent.benefits = merged.benefits.map((item) => `${item.title}: ${item.description}`).join('\n')
  page.serviceContent.process = merged.process.map((item) => `${item.title}: ${item.description}`).join('\n')
  page.serviceContent.documentsRequired = merged.documents.map((item) => `${item.title}: ${item.description}`).join('\n')
  page.faqs = merged.faqs.map((item, index) => ({ id: item.id, question: item.question, answer: item.answer, status: 'active', displayOrder: index + 1 }))
  page.schema.service = 'auto'
  page.schema.faqPage = page.faqs.length ? 'auto' : 'disabled'
  page.breadcrumbs = { manualOverride: true, items: ['Home', merged.serviceName] }
  const sections: CmsSection[] = [
    section(pageId, 'heading_content', page.h1, page.introduction),
    ...(about.description ? [section(pageId, 'rich_text', about.heading || 'About this service', about.description)] : []),
    ...(merged.benefits.length ? [{ ...section(pageId, 'bullet_list', 'Benefits'), rows: merged.benefits.map((item) => ({ Title: item.title, Description: item.description })) }] : []),
    ...(merged.process.length ? [{ ...section(pageId, 'numbered_steps', 'Process'), rows: merged.process.map((item) => ({ Step: item.title, Description: item.description })) }] : []),
    ...(merged.documents.length ? [{ ...section(pageId, 'documents_table', 'Documents required'), columns: [{ name: 'Document', type: 'text' as const }, { name: 'Details', type: 'text' as const }, { name: 'Requirement', type: 'badge' as const }], rows: merged.documents.map((item) => ({ Document: item.title, Details: item.description, Requirement: item.required })) }] : []),
    ...(merged.faqs.length ? [{ ...section(pageId, 'faq', 'Frequently asked questions'), columns: [{ name: 'Question', type: 'text' as const }, { name: 'Answer', type: 'text' as const }], rows: merged.faqs.map((item) => ({ Question: item.question, Answer: item.answer })) }] : []),
    ...(merged.cta.heading ? [section(pageId, 'cta', merged.cta.heading, merged.cta.description)] : []),
  ]
  return { page, sections: sections.map((item, index) => ({ ...item, order: index + 1 })) }
}
