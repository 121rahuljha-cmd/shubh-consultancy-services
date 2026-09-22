import { createEmptyPage, getPages, savePages, type CmsLink, type CmsPage, type PageType } from '@/lib/page-cms'
import { getPlans, makePlan, planKey, savePlans } from '@/lib/content-plan'
import { getState, states, top100Cities, type City, type State } from '@/lib/locations'

export type LocationPageFilter = { query?: string; pageType?: PageType | 'all'; stateId?: string; cityId?: string; status?: CmsPage['status'] | 'all'; generationStatus?: CmsPage['generationStatus'] | 'all'; seoStatus?: CmsPage['seoStatus'] | 'all' }
export type LocationSeoRisk = { contentSimilarityRisk: 'low' | 'medium' | 'high'; duplicateTitleRisk: boolean; duplicateMetaRisk: boolean; thinContentRisk: boolean; locationDifferentiationRisk: 'low' | 'medium' | 'high'; needsVerification: boolean }

export const locationLinkLimits = { serviceStateLinks: 36, stateCityLinks: 20, cityLocationLinks: 10, relatedServiceLinks: 8 } as const
export const locationIdentity = (page: Pick<CmsPage, 'pageType' | 'serviceId' | 'stateId' | 'cityId'>) => [page.pageType, page.serviceId, page.stateId, page.cityId].join('|')
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const isLocationPage = (page: CmsPage) => page.pageType === 'service_state' || page.pageType === 'service_city'
const publicLocationPage = (page: CmsPage) => isLocationPage(page) && page.status === 'published' && page.robotsIndex && page.sitemap.include
const emptyLocationRisk = (): LocationSeoRisk => ({ contentSimilarityRisk: 'low', duplicateTitleRisk: false, duplicateMetaRisk: false, thinContentRisk: true, locationDifferentiationRisk: 'high', needsVerification: true })

const makeLocationPage = (serviceSlug: string, serviceName: string, state: State, city?: City): CmsPage => {
  const page = createEmptyPage()
  const locationName = city?.name || state.name
  page.id = `location-${serviceSlug}-${city?.slug || state.slug}`
  page.title = `${serviceName} in ${locationName}`
  page.slug = `services/${slug(serviceSlug)}/${state.slug}${city ? `/${city.slug}` : ''}`
  page.pageType = city ? 'service_city' : 'service_state'
  page.status = 'planned'; page.serviceId = serviceSlug; page.stateId = state.id; page.cityId = city?.id || ''
  page.generationStatus = 'planned'; page.seoStatus = 'pending'; page.primaryKeyword = `${serviceName} in ${locationName}`
  page.searchIntent = 'local'; page.targetAudience = 'Businesses seeking verified compliance support'; page.targetLocation = city ? `${city.name}, ${state.name}` : state.name
  page.seoTitle = `${serviceName} in ${locationName} | Shubh Consultancy Services`
  page.metaDescription = `Planned ${serviceName.toLowerCase()} guidance for ${locationName}. Local information requires editorial verification before publication.`
  page.canonicalUrl = `/${page.slug}`; page.robotsIndex = false; page.robotsFollow = true; page.sitemap.include = false
  page.indexingStatus = 'PLANNED — noindex and excluded from sitemap'
  page.breadcrumbs = { manualOverride: true, items: ['Home', serviceName, state.name, ...(city ? [city.name] : [])] }
  page.locationSeoRisk = emptyLocationRisk()
  return page
}

const planFromLocationPage = (page: CmsPage, serviceName: string) => {
  const state = getState(page.stateId); const city = top100Cities.find((item) => item.id === page.cityId)
  return makePlan({ id: `location-plan-${page.id}`, title: page.title, slug: page.slug, pageType: page.pageType === 'service_city' ? 'service_city' : 'service_state', category: 'Location service page', subcategory: page.pageType === 'service_city' ? 'City service page' : 'State/UT service page', service: serviceName, serviceId: page.serviceId, state: state?.name || page.stateId, stateId: page.stateId, city: city?.name || '', cityId: page.cityId, primaryKeyword: page.primaryKeyword, searchIntent: 'Local commercial', targetAudience: page.targetAudience, status: page.status === 'planned' ? 'planned' : page.status === 'published' ? 'published' : page.generationStatus === 'approved' ? 'approved' : page.generationStatus === 'needs_review' ? 'needs_review' : 'draft', seoTitle: page.seoTitle, metaDescription: page.metaDescription, canonical: page.canonicalUrl, robotsIndex: page.robotsIndex, robotsFollow: page.robotsFollow, breadcrumbs: page.breadcrumbs.items.join(' > '), sitemap: page.sitemap.include, indexingStatus: page.indexingStatus, h1: page.h1, introduction: page.introduction, mainContent: page.mainContent, brief: { ...makePlan().brief, primaryTopic: page.title, searchIntent: 'Local commercial', suggestedH1: page.title, suggestedH2s: 'Service overview\nPractical considerations\nDocuments\nProcess\nFAQs', locationRequirements: `Use verified, useful local relevance for ${page.targetLocation}; do not substitute location names into generic text.` } })
}

export function syncLocationContentPlans(locationPages: CmsPage[], serviceName: string) {
  const plans = getPlans(); const byId = new Map(plans.map((plan) => [plan.id, plan])); const existingKeys = new Set(plans.map(planKey)); let added = 0; let changed = false
  const next = plans.map((plan) => {
    const page = locationPages.find((item) => `location-plan-${item.id}` === plan.id)
    if (!page) return plan
    changed = true; return { ...planFromLocationPage(page, serviceName), createdAt: plan.createdAt, updatedAt: new Date().toISOString() }
  })
  for (const page of locationPages) {
    if (byId.has(`location-plan-${page.id}`)) continue
    const plan = planFromLocationPage(page, serviceName); if (existingKeys.has(planKey(plan))) continue
    existingKeys.add(planKey(plan)); next.push(plan); added += 1; changed = true
  }
  if (changed) savePlans(next)
  return added
}

export function planLocationPages(serviceSlug: string, serviceName: string, scope: 'all' | 'state' | 'city' = 'all') {
  const pages = getPages(); const existing = new Set(pages.filter((page) => page.serviceId === serviceSlug && isLocationPage(page)).map(locationIdentity)); const additions: CmsPage[] = []
  if (scope !== 'city') for (const state of states) { const page = makeLocationPage(serviceSlug, serviceName, state); if (!existing.has(locationIdentity(page))) { existing.add(locationIdentity(page)); additions.push(page) } }
  if (scope !== 'state') for (const city of top100Cities) { const state = getState(city.stateId); if (!state) continue; const page = makeLocationPage(serviceSlug, serviceName, state, city); if (!existing.has(locationIdentity(page))) { existing.add(locationIdentity(page)); additions.push(page) } }
  const all = additions.length ? [...pages, ...additions] : pages
  if (additions.length) savePages(all)
  const servicePages = all.filter((page) => page.serviceId === serviceSlug && isLocationPage(page)); syncLocationContentPlans(servicePages, serviceName)
  return { added: additions.length, total: servicePages.length, statePages: servicePages.filter((page) => page.pageType === 'service_state').length, cityPages: servicePages.filter((page) => page.pageType === 'service_city').length }
}

export function getLocationPages(serviceSlug: string, filter: LocationPageFilter = {}) {
  const query = (filter.query || '').toLowerCase()
  return getPages().filter((page) => page.serviceId === serviceSlug && isLocationPage(page) && (!filter.pageType || filter.pageType === 'all' || page.pageType === filter.pageType) && (!filter.stateId || page.stateId === filter.stateId) && (!filter.cityId || page.cityId === filter.cityId) && (!filter.status || filter.status === 'all' || page.status === filter.status) && (!filter.generationStatus || filter.generationStatus === 'all' || page.generationStatus === filter.generationStatus) && (!filter.seoStatus || filter.seoStatus === 'all' || page.seoStatus === filter.seoStatus) && (!query || `${page.title} ${page.slug} ${page.targetLocation}`.toLowerCase().includes(query))).sort((a, b) => a.title.localeCompare(b.title))
}

export function saveLocationPage(page: CmsPage, serviceName?: string) { const all = getPages().map((item) => item.id === page.id ? page : item); savePages(all); if (serviceName) syncLocationContentPlans(all.filter((item) => item.serviceId === page.serviceId && isLocationPage(item)), serviceName) }

const tokens = (value: string) => new Set(value.toLowerCase().match(/[a-z]{3,}/g) || [])
const similarity = (a: string, b: string) => { const first = tokens(a); const second = tokens(b); const union = new Set([...first, ...second]); return union.size ? [...first].filter((item) => second.has(item)).length / union.size : 0 }
const locationText = (page: CmsPage) => [page.h1, page.introduction, page.overview, page.mainContent, ...Object.values(page.locationContent), ...Object.values(page.serviceContent)].join(' ')

export function evaluateLocationSeoRisk(page: CmsPage, allPages = getPages()): LocationSeoRisk {
  const text = locationText(page); const peers = allPages.filter((item) => item.id !== page.id && item.serviceId === page.serviceId && isLocationPage(item)); const maxSimilarity = peers.reduce((maximum, peer) => Math.max(maximum, similarity(text, locationText(peer))), 0)
  const locationName = page.targetLocation.split(',')[0].trim(); const locationMentions = locationName ? (text.toLowerCase().match(new RegExp(locationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length : 0
  return { contentSimilarityRisk: maxSimilarity >= 0.82 ? 'high' : maxSimilarity >= 0.62 ? 'medium' : 'low', duplicateTitleRisk: peers.some((peer) => peer.seoTitle.trim().toLowerCase() === page.seoTitle.trim().toLowerCase()), duplicateMetaRisk: peers.some((peer) => peer.metaDescription.trim().toLowerCase() === page.metaDescription.trim().toLowerCase()), thinContentRisk: text.trim().length < 900, locationDifferentiationRisk: locationMentions >= 3 ? 'low' : locationMentions >= 1 ? 'medium' : 'high', needsVerification: true }
}

export function locationPageStats(pages: CmsPage[]) { return { planned: pages.filter((page) => page.status === 'planned').length, generated: pages.filter((page) => page.generationStatus === 'generated').length, needsReview: pages.filter((page) => page.generationStatus === 'needs_review').length, approved: pages.filter((page) => page.generationStatus === 'approved').length, published: pages.filter((page) => page.status === 'published').length } }
const toLink = (page: CmsPage): CmsLink => ({ id: `location-link-${page.id}`, anchorText: page.title, url: `/${page.slug}`, description: page.targetLocation, openInNewTab: false, status: 'active', displayOrder: 0 })
export function publishedLocationLinks(page: CmsPage, allPages = getPages()) { const published = allPages.filter(publicLocationPage); const statesForService = published.filter((item) => item.serviceId === page.serviceId && item.pageType === 'service_state').slice(0, locationLinkLimits.serviceStateLinks); const citiesForState = published.filter((item) => item.serviceId === page.serviceId && item.pageType === 'service_city' && item.stateId === page.stateId).slice(0, locationLinkLimits.stateCityLinks); const nearbyCities = published.filter((item) => item.serviceId === page.serviceId && item.pageType === 'service_city' && item.id !== page.id).slice(0, locationLinkLimits.cityLocationLinks); return { stateLinks: statesForService.map(toLink), cityLinks: (page.pageType === 'service_state' ? citiesForState : nearbyCities).map(toLink) } }
