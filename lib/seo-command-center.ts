import { getBuilderRecords } from '@/lib/service-builder'
import { getCity, getState, top100Cities } from '@/lib/locations'
import { pageText, type CmsPage } from '@/lib/page-cms'
import { locationIdentity, locationLinkLimits, publishedLocationLinks } from '@/lib/location-pages'
import { getClusterForService, getRelatedServices, isPublicLinkable } from '@/lib/service-clusters'

export type SeoSeverity = 'critical' | 'high' | 'medium' | 'low'
export type SeoResult = 'pass' | 'warning' | 'error'
export type SeoIssue = { id: string; result: SeoResult; severity: SeoSeverity; message: string; field: string; fix: string }
export type SeoAudit = { pageId: string; score: number; issues: SeoIssue[]; errors: number; warnings: number; auditedAt: string }
export type LinkAudit = { outgoing: number; incoming: number; broken: number; orphan: 'none' | 'true_orphan' | 'intentionally_unlinked' | 'unpublished'; excessive: boolean; expected: string[]; missing: string[]; invalid: string[] }
export type CannibalizationRisk = { pageId: string; relatedPageId: string; reason: string; confidence: 'medium' | 'high' }

const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const compact = (value: string) => normalized(value).replace(/\b(in|for|the|and|of)\b/g, '').replace(/\s+/g, ' ').trim()
const pageUrl = (page: CmsPage) => `/${page.slug.replace(/^\/+/, '')}`
const isEligiblePublic = (page: CmsPage) => page.status === 'published' && page.robotsIndex && page.sitemap.include
const isLocation = (page: CmsPage) => page.pageType === 'service_state' || page.pageType === 'service_city'
const issue = (id: string, result: SeoResult, severity: SeoSeverity, message: string, field: string, fix: string): SeoIssue => ({ id, result, severity, message, field, fix })

type SeoIndexes = {
  eligible: CmsPage[]
  publicUrls: Set<string>
  outgoing: Map<string, string[]>
  incoming: Map<string, number>
  duplicateValues: Map<string, Map<string, CmsPage[]>>
  locationIdentities: Map<string, CmsPage[]>
  pagesByUrl: Map<string, CmsPage>
  doorwayRisks: { pageId: string; relatedPageId: string; reason: string; confidence: 'medium' | 'high' }[]
}

function createSeoIndexes(pages: CmsPage[]): SeoIndexes {
  const eligible = pages.filter(isEligiblePublic)
  const outgoing = new Map(pages.map((page) => [page.id, linksFor(page)]))
  const incoming = new Map<string, number>()
  for (const page of eligible) for (const url of new Set(outgoing.get(page.id) || [])) incoming.set(url, (incoming.get(url) || 0) + 1)
  const duplicateValues = new Map<string, Map<string, CmsPage[]>>()
  for (const field of ['seoTitle', 'metaDescription', 'h1'] as const) {
    const values = new Map<string, CmsPage[]>()
    for (const page of pages) { const value = normalized(page[field]); if (value) values.set(value, [...(values.get(value) || []), page]) }
    duplicateValues.set(field, values)
  }
  const locationIdentities = new Map<string, CmsPage[]>()
  for (const page of pages) if (isLocation(page)) { const identity = locationIdentity(page); locationIdentities.set(identity, [...(locationIdentities.get(identity) || []), page]) }
  return { eligible, publicUrls: new Set(eligible.map(pageUrl)), outgoing, incoming, duplicateValues, locationIdentities, pagesByUrl: new Map(pages.map((page) => [pageUrl(page), page])), doorwayRisks: findDoorwayRisks(pages) }
}

function linksFor(page: CmsPage) {
  const cmsLinks = Object.values(page.internalLinks).flat().filter((link) => link.status === 'active').map((link) => link.url)
  const blockLinks = page.blocks.flatMap((block) => block.settings.links?.filter((link) => link.status === 'active').map((link) => link.url) || [])
  return [...cmsLinks, ...blockLinks].filter((url) => url.startsWith('/'))
}

function duplicatePages(page: CmsPage, indexes: SeoIndexes, field: 'seoTitle' | 'metaDescription' | 'h1') {
  return (indexes.duplicateValues.get(field)?.get(normalized(page[field])) || []).filter((other) => other.id !== page.id)
}

export function buildLinkAudit(page: CmsPage, pages: CmsPage[], indexes = createSeoIndexes(pages)): LinkAudit {
  const outgoing = indexes.outgoing.get(page.id) || []
  const expected: string[] = []
  if (page.pageType === 'service_state' || page.pageType === 'service_city') {
    const parent = pages.find((item) => item.pageType === 'service' && item.serviceId === page.serviceId)
    if (parent) expected.push(pageUrl(parent))
    const locationLinks = publishedLocationLinks(page, pages)
    expected.push(...locationLinks.stateLinks.map((link) => link.url), ...locationLinks.cityLinks.map((link) => link.url).filter((url) => url !== pageUrl(page)))
    expected.push(...getRelatedServices(page.serviceId).map((service) => `/services/${service.slug}`))
  } else {
    expected.push(...getRelatedServices(page.serviceId).map((service) => `/services/${service.slug}`))
  }
  const missing = isEligiblePublic(page) ? expected.filter((url) => !outgoing.includes(url)) : []
  const invalid = outgoing.filter((url) => { const target = indexes.pagesByUrl.get(url); return !indexes.publicUrls.has(url) && !(url.startsWith('/services/') && isPublicLinkable(url.replace('/services/', ''))) || Boolean(target && !isEligiblePublic(target)) })
  if (page.status !== 'published') return { outgoing: 0, incoming: 0, broken: invalid.length, orphan: 'unpublished', excessive: false, expected, missing, invalid }
  if (!isEligiblePublic(page)) return { outgoing: 0, incoming: 0, broken: invalid.length, orphan: 'intentionally_unlinked', excessive: false, expected, missing, invalid }
  const broken = invalid.length
  const incoming = indexes.incoming.get(pageUrl(page)) || 0
  const cluster = getClusterForService(page.serviceId)
  const limit = page.pageType === 'service_state' || page.pageType === 'service_city' ? Math.max(cluster?.maxRelatedServices || locationLinkLimits.relatedServiceLinks, locationLinkLimits.serviceStateLinks + locationLinkLimits.stateCityLinks + locationLinkLimits.cityLocationLinks) : cluster?.maxRelatedServices || locationLinkLimits.relatedServiceLinks
  return { outgoing: outgoing.length, incoming, broken, orphan: incoming ? 'none' : 'true_orphan', excessive: outgoing.length > limit, expected, missing, invalid }
}

const similarityTokens = (value: string) => new Set(normalized(value).split(' ').filter((token) => token.length > 2))
const similarityRatio = (first: string, second: string) => { const a = similarityTokens(first); const b = similarityTokens(second); const union = new Set([...a, ...b]); return union.size ? [...a].filter((token) => b.has(token)).length / union.size : 0 }
const locationContent = (page: CmsPage) => pageText(page).toLowerCase()

function findDoorwayRisks(pages: CmsPage[]) {
  const risks: { pageId: string; relatedPageId: string; reason: string; confidence: 'medium' | 'high' }[] = []
  const groups = new Map<string, CmsPage[]>()
  for (const page of pages.filter((item) => isLocation(item) || item.pageType === 'service')) {
    const key = `${page.serviceId}:${page.pageType}:${page.pageType === 'service_city' ? 'city' : page.pageType === 'service_state' ? 'state' : 'service'}`
    groups.set(key, [...(groups.get(key) || []), page])
  }
  const compare = (first: CmsPage, second: CmsPage) => {
    const sameMeta = normalized(first.seoTitle) === normalized(second.seoTitle) || normalized(first.metaDescription) === normalized(second.metaDescription) || normalized(first.h1) === normalized(second.h1)
    const ratio = similarityRatio(locationContent(first), locationContent(second))
    const locationOnly = normalized(locationContent(first).replaceAll(normalized(first.targetLocation.split(',')[0]), '')) === normalized(locationContent(second).replaceAll(normalized(second.targetLocation.split(',')[0]), ''))
    if (sameMeta || ratio >= 0.82 || locationOnly || locationContent(first).trim().length < 300) risks.push({ pageId: first.id, relatedPageId: second.id, reason: 'Potential Doorway / Near-Duplicate Content', confidence: sameMeta || ratio >= 0.9 || locationOnly ? 'high' : 'medium' })
  }
  for (const group of groups.values()) for (let index = 0; index < group.length; index += 1) for (let otherIndex = index + 1; otherIndex < group.length; otherIndex += 1) compare(group[index], group[otherIndex])
  return risks
}

export function auditSeoPage(page: CmsPage, pages: CmsPage[], indexes = createSeoIndexes(pages)): SeoAudit {
  const text = pageText(page).trim(); const isPublished = page.status === 'published'; const links = buildLinkAudit(page, pages, indexes); const issues: SeoIssue[] = []
  const add = (...item: Parameters<typeof issue>) => issues.push(issue(...item))
  add('title-present', page.seoTitle ? 'pass' : 'error', 'critical', page.seoTitle ? 'SEO title is present.' : 'SEO title is missing.', 'SEO title', 'Add a unique descriptive SEO title.')
  if (page.seoTitle) add('title-length', page.seoTitle.length >= 45 && page.seoTitle.length <= 65 ? 'pass' : 'warning', 'medium', `SEO title is ${page.seoTitle.length} characters.`, 'SEO title', 'Aim for a concise, descriptive title near 50–60 characters where practical.')
  add('meta-present', page.metaDescription ? 'pass' : 'error', 'high', page.metaDescription ? 'Meta description is present.' : 'Meta description is missing.', 'Meta description', 'Add a unique meta description.')
  if (page.metaDescription) add('meta-length', page.metaDescription.length >= 120 && page.metaDescription.length <= 170 ? 'pass' : 'warning', 'low', `Meta description is ${page.metaDescription.length} characters.`, 'Meta description', 'Review for a useful, concise description; length is only a guideline.')
  add('h1-present', page.h1 ? 'pass' : 'error', 'high', page.h1 ? 'H1 is present.' : 'H1 is missing.', 'H1', 'Add one clear page H1.')
  add('canonical-present', page.canonicalUrl ? 'pass' : 'error', 'critical', page.canonicalUrl ? 'Canonical is configured.' : 'Canonical is missing.', 'Canonical', 'Set the canonical URL after editorial review.')
  add('content-present', text ? 'pass' : 'error', 'critical', text ? 'Structured page content exists.' : 'No meaningful structured page content was found.', 'Content', 'Add original, useful page content.')
  if (text) add('content-depth', text.length >= 900 ? 'pass' : 'warning', 'high', `Structured content has ${text.length} characters.`, 'Content', 'Expand with useful original guidance; avoid filler.')
  add('breadcrumbs', page.breadcrumbs.items.length ? 'pass' : 'warning', 'low', page.breadcrumbs.items.length ? 'Breadcrumbs are configured.' : 'Breadcrumbs are missing.', 'Breadcrumbs', 'Configure a logical breadcrumb path.')
  add('schema', page.schema.webPage !== 'disabled' ? 'pass' : 'warning', 'low', page.schema.webPage !== 'disabled' ? 'WebPage schema is enabled or automatic.' : 'WebPage schema is disabled.', 'Schema', 'Review whether appropriate schema can be enabled.')
  if (page.featuredImage.image) add('image-alt', page.featuredImage.altText ? 'pass' : 'warning', 'medium', page.featuredImage.altText ? 'Featured image has alt text.' : 'Featured image is missing alt text.', 'Featured image', 'Add accurate, natural alt text.')
  if (page.pageType === 'service' || isLocation(page)) add('faq-coverage', page.faqs.length ? 'pass' : 'warning', 'low', page.faqs.length ? `${page.faqs.length} FAQ(s) configured.` : 'No FAQs are configured.', 'FAQ', 'Add FAQs only where they provide genuine value.')
  add('internal-links', links.missing.length ? 'warning' : links.outgoing >= 2 || !isPublished ? 'pass' : 'warning', 'medium', isPublished ? `${links.outgoing} outgoing internal link(s); ${links.missing.length} configured relationship link(s) missing.` : 'Link requirements apply after publication.', 'Internal links', 'Add relevant links only to eligible published/indexable pages.')
  if (isPublished) {
    add('published-indexability', page.robotsIndex ? 'pass' : 'warning', 'medium', page.robotsIndex ? 'Published page is indexable.' : 'Published page is noindex.', 'Robots', 'Confirm whether this published page should remain noindex.')
    add('sitemap-safety', page.robotsIndex && !page.sitemap.include ? 'warning' : page.sitemap.include && !page.robotsIndex ? 'error' : 'pass', page.sitemap.include && !page.robotsIndex ? 'critical' : 'medium', page.sitemap.include && !page.robotsIndex ? 'Noindex page is included in the sitemap.' : page.robotsIndex && !page.sitemap.include ? 'Indexable published page is excluded from the sitemap.' : 'Sitemap configuration is consistent.', 'Sitemap', 'Keep sitemap inclusion limited to published, indexable pages.')
  } else if (page.sitemap.include || page.robotsIndex) add('unpublished-safety', 'warning', 'medium', 'Unpublished page has indexability or sitemap enabled.', 'Robots / Sitemap', 'Keep unpublished pages noindex and out of the sitemap until review is complete.')
  const duplicateTitle = duplicatePages(page, indexes, 'seoTitle'); const duplicateMeta = duplicatePages(page, indexes, 'metaDescription'); const duplicateH1 = duplicatePages(page, indexes, 'h1')
  add('duplicate-title', duplicateTitle.length ? 'warning' : 'pass', 'high', duplicateTitle.length ? `SEO title matches ${duplicateTitle.length} other page(s).` : 'SEO title is unique among CMS pages.', 'SEO title', 'Differentiate the title based on actual page intent.')
  add('duplicate-meta', duplicateMeta.length ? 'warning' : 'pass', 'high', duplicateMeta.length ? `Meta description matches ${duplicateMeta.length} other page(s).` : 'Meta description is unique among CMS pages.', 'Meta description', 'Write a unique, useful description.')
  add('duplicate-h1', duplicateH1.length ? 'warning' : 'pass', 'high', duplicateH1.length ? `H1 matches ${duplicateH1.length} other page(s).` : 'H1 is unique among CMS pages.', 'H1', 'Differentiate the H1 according to page intent.')
  if (links.broken) add('broken-internal-links', 'error', 'high', `${links.broken} internal link(s) do not resolve to eligible published/indexable CMS pages.`, 'Internal links', 'Remove or correct broken links.')
  if (links.excessive) add('excessive-internal-links', 'warning', 'medium', `${links.outgoing} outgoing internal links may be excessive.`, 'Internal links', 'Keep only contextual, relevant links.')
  if (isLocation(page)) {
    const state = getState(page.stateId); const city = page.cityId ? (getCity(page.cityId) || top100Cities.find((item) => item.id === page.cityId)) : undefined; const serviceRecord = getBuilderRecords().find((record) => record.serviceSlug === page.serviceId); const parent = Boolean(serviceRecord) || pages.some((item) => item.pageType === 'service' && item.serviceId === page.serviceId)
    add('location-parent-service', parent ? 'pass' : 'error', 'critical', parent ? 'Parent service exists.' : 'Parent service record was not found.', 'Service relationship', 'Assign a valid parent service.')
    add('location-state', state ? 'pass' : 'error', 'critical', state ? 'State/UT record exists.' : 'State/UT record was not found.', 'State', 'Assign a valid State/UT.')
    if (page.pageType === 'service_city') add('location-city', Boolean(city) && city?.stateId === page.stateId ? 'pass' : 'error', 'critical', city?.stateId === page.stateId ? 'City belongs to its selected state.' : 'City is missing or does not belong to the selected state.', 'City', 'Assign a city from the selected state.')
    const expectedSlug = `services/${page.serviceId}/${state?.slug || normalized(page.stateId)}${page.pageType === 'service_city' ? `/${city?.slug || normalized(page.cityId)}` : ''}`; add('location-slug', page.slug === expectedSlug ? 'pass' : 'error', 'high', page.slug === expectedSlug ? 'Location slug matches the current service and location identity.' : 'Location slug does not match the current service and location identity.', 'Slug', `Use /${expectedSlug}.`)
    const expectedTitle = serviceRecord?.serviceName ? `${serviceRecord.serviceName} in ${city?.name || state?.name || page.targetLocation.split(',')[0].trim()}` : ''; add('location-title-identity', !expectedTitle || normalized(page.title) === normalized(expectedTitle) ? 'pass' : 'warning', 'high', !expectedTitle || normalized(page.title) === normalized(expectedTitle) ? 'Location title matches the current identity.' : 'Location title does not match the current service and location identity.', 'Title', 'Use a title that names the current service and location.')
    add('location-publication-safety', page.status === 'published' ? (page.robotsIndex && page.sitemap.include ? 'pass' : 'error') : (!page.robotsIndex && !page.sitemap.include ? 'pass' : 'warning'), page.status === 'published' ? 'critical' : 'medium', page.status === 'published' ? (page.robotsIndex && page.sitemap.include ? 'Published location page is indexable and in the sitemap.' : 'Published location page is not consistently indexable and included in the sitemap.') : (!page.robotsIndex && !page.sitemap.include ? 'Unpublished location page is safely excluded.' : 'Unpublished location page has indexability or sitemap enabled.'), 'Robots / Sitemap', 'Keep only published, indexable location pages in the sitemap.')
    const sameIdentity = (indexes.locationIdentities.get(locationIdentity(page)) || []).filter((item) => item.id !== page.id); add('location-identity', sameIdentity.length ? 'error' : 'pass', 'critical', sameIdentity.length ? 'Duplicate location page identity detected.' : 'Location page identity is unique.', 'Location identity', 'Keep one page per type/service/state/city combination.')
    const doorway = indexes.doorwayRisks.some((risk) => risk.pageId === page.id); add('location-similarity', doorway ? 'warning' : 'pass', 'high', doorway ? 'Potential Doorway / Near-Duplicate Content detected.' : 'No fresh near-duplicate location match detected.', 'Location differentiation', 'Review and add genuinely useful, verified differentiation.'); add('location-thin-content', text.length < 900 ? 'warning' : 'pass', 'high', text.length < 900 ? 'Location content is extremely thin.' : 'Location content depth is acceptable.', 'Content', 'Add substantive, useful content before approval.')
  }
  const scored = issues.filter((item) => item.id !== 'unpublished-safety'); const points = scored.reduce((sum, item) => sum + (item.result === 'pass' ? 1 : item.result === 'warning' ? .5 : 0), 0)
  return { pageId: page.id, score: scored.length ? Math.round(points / scored.length * 100) : 0, issues, errors: issues.filter((item) => item.result === 'error').length, warnings: issues.filter((item) => item.result === 'warning').length, auditedAt: new Date().toISOString() }
}

export function auditAllSeoPages(pages: CmsPage[]) { const indexes = createSeoIndexes(pages); return new Map(pages.map((page) => [page.id, auditSeoPage(page, pages, indexes)])) }

export function findCannibalization(pages: CmsPage[]): CannibalizationRisk[] {
  const matches = new Map<string, { pageId: string; relatedPageId: string; reasons: Set<string>; high: boolean }>()
  const compareGroup = (group: CmsPage[], reason: string) => { for (let index = 0; index < group.length; index += 1) for (let otherIndex = index + 1; otherIndex < group.length; otherIndex += 1) { const first = group[index]; const second = group[otherIndex]; const key = `${first.id}:${second.id}`; const match = matches.get(key) || { pageId: first.id, relatedPageId: second.id, reasons: new Set<string>(), high: false }; match.reasons.add(reason); match.high ||= match.reasons.size > 1; matches.set(key, match) } }
  const groups = (getValue: (page: CmsPage) => string) => { const grouped = new Map<string, CmsPage[]>(); for (const page of pages) { const value = getValue(page); if (value) grouped.set(value, [...(grouped.get(value) || []), page]) } return grouped.values() }
  for (const group of groups((page) => compact(page.seoTitle || page.title))) compareGroup(group, 'Normalized titles are very similar.')
  for (const group of groups((page) => compact(page.h1))) compareGroup(group, 'H1 values are very similar.')
  for (const group of groups((page) => normalized(page.primaryKeyword))) compareGroup(group, 'Primary keywords are identical.')
  return [...matches.values()].map((match) => ({ pageId: match.pageId, relatedPageId: match.relatedPageId, confidence: match.high ? 'high' : 'medium', reason: [...match.reasons].join(' ') }))
}

export function seoSummary(pages: CmsPage[]) {
  const indexes = createSeoIndexes(pages); const audits = new Map(pages.map((page) => [page.id, auditSeoPage(page, pages, indexes)])); const links = new Map(pages.map((page) => [page.id, buildLinkAudit(page, pages, indexes)])); const cannibalization = findCannibalization(pages)
  return { audits, links, cannibalization, counts: { total: pages.length, published: pages.filter((page) => page.status === 'published').length, draft: pages.filter((page) => page.status === 'draft').length, planned: pages.filter((page) => page.status === 'planned').length, needsReview: pages.filter((page) => page.status === 'review' || page.generationStatus === 'needs_review').length, noindex: pages.filter((page) => !page.robotsIndex).length, sitemap: pages.filter((page) => page.sitemap.include).length, seoReady: [...audits.values()].filter((audit) => audit.errors === 0 && audit.warnings === 0).length, seoErrors: [...audits.values()].filter((audit) => audit.errors > 0).length, seoWarnings: [...audits.values()].filter((audit) => audit.warnings > 0).length, orphan: [...links.values()].filter((link) => link.orphan === 'true_orphan').length, intentionallyUnlinked: [...links.values()].filter((link) => link.orphan === 'intentionally_unlinked').length, unpublished: [...links.values()].filter((link) => link.orphan === 'unpublished').length, thin: pages.filter((page) => pageText(page).trim().length < 900).length, cannibalization: cannibalization.length } }
}
