export type PageStatus = 'planned' | 'draft' | 'review' | 'published' | 'archived'
export type PageType = 'page' | 'service' | 'state' | 'city' | 'article' | 'service_state' | 'service_city'
export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational' | 'local'
export type BlockType = 'rich-text' | 'heading-content' | 'table' | 'searchable-table' | 'link-grid' | 'searchable-link-grid' | 'card-grid' | 'faq' | 'image-text' | 'cta' | 'custom'
export type SettingMode = 'auto' | 'manual' | 'disabled'
export type AuditStatus = 'pass' | 'warning' | 'error'
export type CmsRevision = { id: string; pageId: string; version: number; page: CmsPage; sections: import('@/lib/cms-sections').CmsSection[]; changeType: 'ai-generated' | 'ai-improved' | 'manual' | 'restore'; createdAt: string }

export type CmsLink = { id: string; anchorText: string; url: string; description?: string; openInNewTab: boolean; status: 'active' | 'draft'; displayOrder: number }
export type CmsFaq = { id: string; question: string; answer: string; status: 'active' | 'draft'; displayOrder: number }
export type CmsTable = { columns: string[]; rows: string[][] }
export type ContentBlock = {
  id: string
  type: BlockType
  title: string
  content: string
  settings: { searchEnabled?: boolean; searchPlaceholder?: string; searchButtonText?: string; table?: CmsTable; links?: CmsLink[]; faqs?: CmsFaq[]; image?: MediaSeo }
  displayOrder: number
  status: 'active' | 'disabled'
}
export type MediaSeo = { image: string; altText: string; title: string; caption: string; description: string }
export type SchemaSettings = { webPage: SettingMode; service: SettingMode; article: SettingMode; breadcrumbList: SettingMode; faqPage: SettingMode; organization: SettingMode; localBusiness: SettingMode }
export type LocationContent = { introduction: string; serviceInformation: string; authority: string; process: string; documents: string; faqs: string; contact: string }
export type ServiceContent = { overview: string; benefits: string; eligibility: string; whoCanApply: string; documentsRequired: string; process: string; fees: string; timeline: string; validity: string; importantInformation: string; commonMistakes: string; whyChooseUs: string; conclusion: string }

export type CmsPage = {
  id: string; title: string; slug: string; pageType: PageType; status: PageStatus; parentId: string; categoryId: string; serviceId: string; stateId: string; cityId: string; generationStatus: 'planned' | 'generated' | 'needs_review' | 'approved' | 'published'; generationError?: string; seoStatus: 'pending' | 'warning' | 'ready'
  createdAt: string; updatedAt: string; publishedAt: string
  primaryKeyword: string; secondaryKeywords: string; searchIntent: SearchIntent; targetAudience: string; targetLocation: string; keywordVariations: string; relatedTopics: string; relatedEntities: string
  seoTitle: string; metaDescription: string; canonicalUrl: string; robotsIndex: boolean; robotsFollow: boolean; ogTitle: string; ogDescription: string; ogImage: string; twitterTitle: string; twitterDescription: string; twitterImage: string
  h1: string; introduction: string; overview: string; mainContent: string
  locationSeoRisk?: import('@/lib/location-pages').LocationSeoRisk
  seoAudit?: import('@/lib/seo-command-center').SeoAudit
  serviceContent: ServiceContent; locationContent: LocationContent; blocks: ContentBlock[]
  internalLinks: { relatedServices: CmsLink[]; popularSearches: CmsLink[]; relatedGuides: CmsLink[]; relatedBlogs: CmsLink[]; stateLinks: CmsLink[]; cityLinks: CmsLink[]; customLinks: CmsLink[] }
  faqs: CmsFaq[]; featuredImage: MediaSeo; schema: SchemaSettings; breadcrumbs: { manualOverride: boolean; items: string[] }; sitemap: { include: boolean; priority: string; changeFrequency: string }; indexingStatus: string
}

const now = new Date().toISOString()
const emptyMedia = (): MediaSeo => ({ image: '', altText: '', title: '', caption: '', description: '' })
const emptyLinks = () => ({ relatedServices: [], popularSearches: [], relatedGuides: [], relatedBlogs: [], stateLinks: [], cityLinks: [], customLinks: [] })

export function createEmptyPage(): CmsPage {
  return { id: crypto.randomUUID(), title: '', slug: '', pageType: 'page', status: 'draft', parentId: '', categoryId: '', serviceId: '', stateId: '', cityId: '', generationStatus: 'planned', seoStatus: 'pending', createdAt: now, updatedAt: now, publishedAt: '', primaryKeyword: '', secondaryKeywords: '', searchIntent: 'informational', targetAudience: '', targetLocation: '', keywordVariations: '', relatedTopics: '', relatedEntities: '', seoTitle: '', metaDescription: '', canonicalUrl: '', robotsIndex: true, robotsFollow: true, ogTitle: '', ogDescription: '', ogImage: '', twitterTitle: '', twitterDescription: '', twitterImage: '', h1: '', introduction: '', overview: '', mainContent: '', serviceContent: { overview: '', benefits: '', eligibility: '', whoCanApply: '', documentsRequired: '', process: '', fees: '', timeline: '', validity: '', importantInformation: '', commonMistakes: '', whyChooseUs: '', conclusion: '' }, locationContent: { introduction: '', serviceInformation: '', authority: '', process: '', documents: '', faqs: '', contact: '' }, blocks: [], internalLinks: emptyLinks(), faqs: [], featuredImage: emptyMedia(), schema: { webPage: 'auto', service: 'auto', article: 'auto', breadcrumbList: 'auto', faqPage: 'auto', organization: 'auto', localBusiness: 'auto' }, breadcrumbs: { manualOverride: false, items: [] }, sitemap: { include: true, priority: '0.5', changeFrequency: 'monthly' }, indexingStatus: 'not submitted' }
}

export const testPage: CmsPage = { ...createEmptyPage(), id: 'test-trademark-mumbai', title: 'Trademark Registration in Mumbai', slug: 'trademark-registration-mumbai', pageType: 'city', status: 'draft', categoryId: 'Trademark', serviceId: 'trademark-registration', stateId: 'Maharashtra', cityId: 'Mumbai', primaryKeyword: 'trademark registration in Mumbai', secondaryKeywords: 'trademark consultant Mumbai, trademark filing Mumbai', searchIntent: 'local', targetAudience: 'Founders and business owners in Mumbai', targetLocation: 'Mumbai, Maharashtra', seoTitle: 'Trademark Registration in Mumbai | Shubh Consultancy Services', metaDescription: 'Register your trademark in Mumbai with expert filing support, class selection and objection guidance from Shubh Consultancy Services.', canonicalUrl: '/trademark-registration/mumbai', h1: 'Trademark Registration in Mumbai', introduction: 'Protect your brand in Mumbai with a correctly prepared trademark application and clear guidance from filing to registration.', overview: 'Our team helps businesses select the right class, prepare documents and track the application with the Trade Marks Registry.', mainContent: 'Trademark registration gives your brand a stronger legal foundation and helps prevent confusingly similar marks from being used in your market.', serviceContent: { ...createEmptyPage().serviceContent, overview: 'End-to-end trademark filing support for Mumbai businesses.', benefits: 'Brand protection\nExclusive commercial use\nStronger enforcement options', eligibility: 'Any individual, startup, company or partnership using a distinctive brand can apply.', documentsRequired: 'Applicant identity proof\nLogo or word mark\nBusiness proof where applicable', process: 'Search and class selection\nApplication preparation\nGovernment filing\nExamination and response support', fees: 'Government fees vary by applicant type and number of classes. Professional fees are quoted separately.', whyChooseUs: 'Local, practical support with transparent next steps.' }, faqs: [{ id: 'faq-1', question: 'How long does trademark registration take in Mumbai?', answer: 'The overall timeline depends on examination, publication and any opposition. We provide milestone updates throughout the application.', status: 'active', displayOrder: 1 }], breadcrumbs: { manualOverride: true, items: ['Home', 'Trademark Registration', 'Maharashtra', 'Mumbai'] }, featuredImage: { ...emptyMedia(), altText: 'Trademark registration documents for a Mumbai business' }, blocks: [{ id: 'block-links', type: 'searchable-link-grid', title: 'Popular Trademark Searches', content: 'Explore related trademark services.', displayOrder: 1, status: 'active', settings: { searchEnabled: true, searchPlaceholder: 'Search trademark services', searchButtonText: 'Search', links: [{ id: 'link-1', anchorText: 'Trademark Search', url: '/services/trademark-registration', description: 'Check your brand before filing.', openInNewTab: false, status: 'active', displayOrder: 1 }] } }] }

export function getPages(): CmsPage[] { if (typeof window === 'undefined') return [testPage]; const raw = window.localStorage.getItem('scs-cms-pages'); if (!raw) { window.localStorage.setItem('scs-cms-pages', JSON.stringify([testPage])); return [testPage] } try { return JSON.parse(raw) as CmsPage[] } catch { return [testPage] } }
export function savePages(pages: CmsPage[]) { window.localStorage.setItem('scs-cms-pages', JSON.stringify(pages)) }
const revisionKey = (pageId: string) => `scs-cms-revisions-${pageId}`
export function getCmsRevisions(pageId: string): CmsRevision[] { if (typeof window === 'undefined') return []; try { return JSON.parse(window.localStorage.getItem(revisionKey(pageId)) || '[]') as CmsRevision[] } catch { return [] } }
export function saveCmsRevision(page: CmsPage, sections: CmsRevision['sections'], changeType: CmsRevision['changeType']) { const revisions = getCmsRevisions(page.id); const revision: CmsRevision = { id: crypto.randomUUID(), pageId: page.id, version: revisions.length + 1, page: structuredClone(page), sections: structuredClone(sections), changeType, createdAt: new Date().toISOString() }; window.localStorage.setItem(revisionKey(page.id), JSON.stringify([...revisions, revision])); return revision }
export function restoreCmsRevision(revision: CmsRevision) { const pages = getPages().map((page) => page.id === revision.pageId ? { ...structuredClone(revision.page), status: 'draft' as const, updatedAt: new Date().toISOString() } : page); savePages(pages); return pages }
export function pageText(page: CmsPage) { return [page.h1, page.introduction, page.overview, page.mainContent, ...Object.values(page.serviceContent), ...Object.values(page.locationContent), ...page.blocks.map((b) => `${b.title} ${b.content}`)].join(' ') }
export type AuditItem = { label: string; status: AuditStatus; detail: string }
export function auditPage(page: CmsPage, pages: CmsPage[]): AuditItem[] {
  const text = pageText(page).toLowerCase(); const keyword = page.primaryKeyword.trim().toLowerCase(); const internal = Object.values(page.internalLinks).flat(); const duplicate = (key: keyof CmsPage) => pages.some((other) => other.id !== page.id && String(other[key]).trim().toLowerCase() === String(page[key]).trim().toLowerCase() && String(page[key]).trim() !== '')
  return [
    { label: 'Primary keyword', status: keyword ? 'pass' : 'error', detail: keyword ? 'Defined for this page.' : 'Add one primary keyword.' },
    { label: 'Keyword in H1', status: keyword && page.h1.toLowerCase().includes(keyword) ? 'pass' : keyword ? 'warning' : 'error', detail: keyword && page.h1.toLowerCase().includes(keyword) ? 'Appears naturally in H1.' : 'Review H1 wording.' },
    { label: 'SEO title and description', status: page.seoTitle && page.metaDescription ? 'pass' : 'error', detail: `${page.seoTitle.length} title chars, ${page.metaDescription.length} description chars.` },
    { label: 'Canonical URL', status: page.canonicalUrl ? 'pass' : 'error', detail: page.canonicalUrl || 'Add a canonical URL.' },
    { label: 'H1 and heading structure', status: page.h1 ? 'pass' : 'error', detail: page.h1 ? 'One primary H1 field is set.' : 'Add an H1.' },
    { label: 'Content length', status: text.trim().length > 300 ? 'pass' : 'warning', detail: `${text.trim().length} characters in structured content.` },
    { label: 'Internal links', status: internal.length ? 'pass' : 'warning', detail: `${internal.length} internal link(s) configured.` },
    { label: 'Media alt text', status: page.featuredImage.image && page.featuredImage.altText ? 'pass' : page.featuredImage.image ? 'warning' : 'warning', detail: page.featuredImage.image ? (page.featuredImage.altText ? 'Featured image has alt text.' : 'Featured image needs alt text.') : 'No featured image selected.' },
    { label: 'FAQ and breadcrumbs', status: page.faqs.length && (page.breadcrumbs.manualOverride || page.breadcrumbs.items.length) ? 'pass' : 'warning', detail: `${page.faqs.length} FAQ(s); ${page.breadcrumbs.items.length} breadcrumb item(s).` },
    { label: 'Schema and sitemap', status: page.schema.webPage !== 'disabled' && (!page.sitemap.include || page.robotsIndex) ? 'pass' : 'warning', detail: page.sitemap.include ? 'Included with robots settings.' : 'Excluded from sitemap.' },
    { label: 'Duplicate slug / canonical', status: duplicate('slug') || duplicate('canonicalUrl') ? 'error' : 'pass', detail: duplicate('slug') || duplicate('canonicalUrl') ? 'Duplicate found.' : 'No duplicate found.' },
    { label: 'Duplicate SEO metadata', status: duplicate('seoTitle') || duplicate('metaDescription') ? 'warning' : 'pass', detail: duplicate('seoTitle') || duplicate('metaDescription') ? 'Review duplicate metadata.' : 'No duplicate title or description.' },
  ]
}
export function scoreAudit(items: AuditItem[]) { const points = items.reduce((sum, item) => sum + (item.status === 'pass' ? 1 : item.status === 'warning' ? 0.5 : 0), 0); return Math.round((points / items.length) * 100) }
