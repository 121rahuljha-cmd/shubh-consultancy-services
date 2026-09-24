import { getBuilderRecords, type ServiceBuilderRecord } from '@/lib/service-builder'
import { filterValidMenuItems, getDefaultMenuItems, menuItemsToGroups, readMenuItems, type MenuItem } from '@/lib/menu-management'
import { serviceCategories, services, type Service } from '@/lib/site-data'

export const HOMEPAGE_SERVICE_LIMIT = 5

export type PublicService = {
  slug: string
  name: string
  navLabel: string
  category: string
  description: string
  tagline: string
  order: number
  href: string
  source: 'builder' | 'site-data'
}

export type PublicServiceGroup = {
  label: string
  blurb: string
  items: PublicService[]
}

const blurbs: Record<string, string> = {
  Startup: 'Choose the right structure and incorporate it correctly the first time.',
  Registrations: 'Sector licences and registrations required to trade legally.',
  Trademark: 'Protect the brand name and logo your business is built on.',
  GST: 'Registration, monthly returns and reconciliation handled end to end.',
  'Income Tax': 'Returns, computations and books maintained by qualified professionals.',
  Compliance: 'Annual filings and statutory records kept current all year.',
  'IT Services': 'Websites and digital marketing that generate real enquiries.',
}

const fromSiteService = (service: Service, order: number): PublicService => ({
  slug: service.slug,
  name: service.name,
  navLabel: service.navLabel,
  category: service.category,
  description: service.summary,
  tagline: service.tagline,
  order,
  href: `/services/${service.slug}`,
  source: 'site-data',
})

const fromBuilderRecord = (record: ServiceBuilderRecord, order: number): PublicService => ({
  slug: record.slug || record.serviceSlug,
  name: record.pageTitle || record.serviceName,
  navLabel: record.serviceName || record.pageTitle,
  category: record.quickInfo.serviceType,
  description: record.shortDescription,
  tagline: record.hero.description,
  order,
  href: `/services/${record.slug || record.serviceSlug}`,
  source: 'builder',
})

export function getPublicServices(): PublicService[] {
  const builderBySlug = new Map(getBuilderRecords().map((record) => [record.serviceSlug, record]))
  const merged = services.flatMap((service, index) => {
    const record = builderBySlug.get(service.slug)
    if (record && (record.status !== 'published' || record.visibility === 'hidden')) return []
    return [record ? fromBuilderRecord(record, index + 1) : fromSiteService(service, index + 1)]
  })
  const additional = getBuilderRecords()
    .filter((record) => record.status === 'published' && record.visibility !== 'hidden' && !services.some((service) => service.slug === record.serviceSlug))
    .map((record, index) => fromBuilderRecord(record, services.length + index + 1))
  return [...merged, ...additional].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

export function getPublicServiceGroups(): PublicServiceGroup[] {
  return getMenuServiceGroups(getDefaultMenuItems(), services.map(fromSiteService))
}

export function getSavedPublicServiceGroups(): PublicServiceGroup[] {
  const saved = filterValidMenuItems(readMenuItems())
  const menuItems = saved.length ? saved : getDefaultMenuItems()
  return getMenuServiceGroups(menuItems)
}

function getMenuServiceGroups(items: MenuItem[], publicServices = getPublicServices()): PublicServiceGroup[] {
  const serviceByUrl = new Map(publicServices.map((service) => [service.href, service]))
  return menuItemsToGroups(items).filter((group) => group.url !== '/' && group.url !== '/contact').map((group) => ({
    label: group.label,
    blurb: blurbs[group.label] ?? '',
    items: group.items.filter((item) => item.url !== '/' && item.url !== '/contact').map((item, index) => serviceByUrl.get(item.url) || { slug: item.pageId, name: item.label, navLabel: item.label, category: group.label, description: '', tagline: '', order: index + 1, href: item.url, source: 'site-data' as const }),
  }))
}

export function getPublicService(slug: string) {
  return getPublicServices().find((service) => service.slug === slug)
}
