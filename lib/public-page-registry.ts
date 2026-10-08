import { listPublishedBlogs } from '@/lib/database-repository'
import { listEnabledClients } from '@/lib/clients'
import { services, serviceCategories } from '@/lib/site-data'
import { categorySlug } from '@/lib/service-inventory'

export type PublicPageType = 'page' | 'service' | 'state' | 'city' | 'blog' | 'service-location'
export type PublicPageStatus = 'live' | 'planned' | 'draft' | 'unpublished' | 'private'
export type PublicPageSeoStatus = 'ready' | 'warning' | 'pending'
export type PublicPageEditability = 'editable' | 'read-only' | 'not-connected' | 'generated'
export type PublicPageIndexability = 'indexable' | 'noindex' | 'draft' | 'excluded'

export type PublicPageDescriptor = {
  id: string
  pageId: string
  slug: string
  title: string
  url: string
  description?: string
  publishedAt?: string | null
  pageType: PublicPageType
  service: string
  serviceId?: string
  serviceName?: string
  category?: string
  state: string
  city: string
  status: PublicPageStatus
  seoStatus: PublicPageSeoStatus
  indexability: PublicPageIndexability
  updatedAt: string | null
  editability: PublicPageEditability
  readOnlyReason?: string
  editorHref?: string
  aiHref?: string
  detailsHref?: string
  source: 'next-route' | 'service-data' | 'location-data'
}

const serviceSeoStatus = (slug: string): PublicPageSeoStatus =>
  slug === 'fssai-food-licence' ? 'ready' : 'warning'

const blogDescription = (content: unknown) => {
  if (!content || typeof content !== 'object') return ''
  const value = content as { summary?: unknown; excerpt?: unknown }
  return typeof value.summary === 'string' ? value.summary : typeof value.excerpt === 'string' ? value.excerpt : ''
}

export async function discoverPublicPages(): Promise<PublicPageDescriptor[]> {
  const fixedPages: PublicPageDescriptor[] = [
    {
      id: 'public-home',
      pageId: 'public-home',
      slug: 'home',
      title: 'Shubh Consultancy Services',
      url: '/',
      description: 'Company registration, FSSAI food licences, GST, income tax returns, trademark filing, ROC compliance and digital marketing services across India.',
      pageType: 'page',
      service: '',
      serviceId: '',
      serviceName: '',
      category: '',
      state: '',
      city: '',
      status: 'live',
      seoStatus: 'ready',
      indexability: 'indexable',
      updatedAt: null,
      editability: 'editable',
      editorHref: '/admin/public-routes',
      detailsHref: '/admin/public-routes',
      source: 'next-route',
    },
    {
      id: 'public-services',
      pageId: 'public-services',
      slug: 'services',
      title: 'All Services',
      url: '/services',
      description: 'Directory of the public services offered by Shubh Consultancy Services.',
      pageType: 'page',
      service: '',
      serviceId: '',
      serviceName: '',
      category: '',
      state: '',
      city: '',
      status: 'live',
      seoStatus: 'ready',
      indexability: 'indexable',
      updatedAt: null,
      editability: 'editable',
      editorHref: '/admin/public-routes',
      detailsHref: '/admin/public-routes',
      source: 'next-route',
    },
    {
      id: 'public-contact',
      pageId: 'public-contact',
      slug: 'contact',
      title: 'Contact',
      url: '/contact',
      description: 'Contact Shubh Consultancy Services for business registration, compliance, tax, licensing and digital marketing enquiries.',
      pageType: 'page',
      service: '',
      serviceId: '',
      serviceName: '',
      category: '',
      state: '',
      city: '',
      status: 'live',
      seoStatus: 'ready',
      indexability: 'indexable',
      updatedAt: null,
      editability: 'editable',
      editorHref: '/admin/public-routes',
      detailsHref: '/admin/public-routes',
      source: 'next-route',
    },
    {
      id: 'public-states',
      pageId: 'public-states',
      slug: 'states',
      title: 'States and union territories',
      url: '/states',
      description: 'Directory of states and union territories covered by the website.',
      pageType: 'state',
      service: '',
      serviceId: '',
      serviceName: '',
      category: '',
      state: '',
      city: '',
      status: 'live',
      seoStatus: 'ready',
      indexability: 'indexable',
      updatedAt: null,
      editability: 'generated',
      readOnlyReason: 'This is a generated directory over centralized location data, not an editable location page.',
      detailsHref: '/admin/service-locations',
      source: 'next-route',
    },
    {
      id: 'public-cities',
      pageId: 'public-cities',
      slug: 'cities',
      title: 'Cities',
      url: '/cities',
      description: 'Directory of cities covered by the website.',
      pageType: 'city',
      service: '',
      serviceId: '',
      serviceName: '',
      category: '',
      state: '',
      city: '',
      status: 'live',
      seoStatus: 'ready',
      indexability: 'indexable',
      updatedAt: null,
      editability: 'generated',
      readOnlyReason: 'This is a generated directory over centralized location data, not an editable location page.',
      detailsHref: '/admin/service-locations',
      source: 'next-route',
    },
  ]

  const servicePages = services.map((service): PublicPageDescriptor => ({
    id: `public-service-${service.slug}`,
    pageId: `public-service-${service.slug}`,
    slug: service.slug,
    title: service.name,
    url: `/services/${service.slug}`,
    description: service.summary,
    pageType: 'service',
    service: service.name,
    serviceId: service.slug,
    serviceName: service.name,
    category: service.category,
    state: '',
    city: '',
    status: 'live',
    seoStatus: serviceSeoStatus(service.slug),
    indexability: 'indexable',
    updatedAt: null,
    editability: 'editable',
    editorHref: `/admin/service-builder/edit?service=${encodeURIComponent(service.slug)}`,
    aiHref: `/admin/service-builder/ai?service=${encodeURIComponent(service.slug)}`,
    source: 'service-data',
  }))

  const categoryPages = serviceCategories.map((category): PublicPageDescriptor => ({
    id: `public-category-${categorySlug(category)}`,
    pageId: `public-category-${categorySlug(category)}`,
    slug: categorySlug(category),
    title: `${category} services`,
    url: `/services/category/${categorySlug(category)}`,
    description: `Public directory of ${category.toLowerCase()} services.`,
    pageType: 'page',
    service: '',
    serviceId: '',
    serviceName: '',
    category,
    state: '',
    city: '',
    status: 'live',
    seoStatus: 'ready',
    indexability: 'indexable',
    updatedAt: null,
    editability: 'generated',
    readOnlyReason: 'This directory is generated from the service inventory and has no page-level CMS override model.',
    detailsHref: '/admin/services',
    source: 'next-route',
  }))

  const enabledClients = await listEnabledClients()
  const clientsPage: PublicPageDescriptor = {
    id: 'public-clients',
    pageId: 'public-clients',
    slug: 'clients',
    title: 'Our Clients',
    url: '/clients',
    description: 'Verified client portfolio of Shubh Consultancy Services.',
    pageType: 'page',
    service: '',
    serviceId: '',
    serviceName: '',
    category: '',
    state: '',
    city: '',
    status: 'live',
    seoStatus: enabledClients.length ? 'ready' : 'pending',
    indexability: enabledClients.length ? 'indexable' : 'noindex',
    updatedAt: null,
    editability: 'not-connected',
    detailsHref: '/admin/clients',
    readOnlyReason: 'Client records are managed in the dedicated client portfolio admin screen.',
    source: 'next-route',
  }

  const legalPages: PublicPageDescriptor[] = [
    ['privacy-policy', 'Privacy Policy'],
    ['terms-and-conditions', 'Terms & Conditions'],
    ['refund-policy', 'Refund Policy'],
  ].map(([slug, title]) => ({
    id: `public-${slug}`,
    pageId: `public-${slug}`,
    slug,
    title,
    url: `/${slug}`,
    description: `${title} for Shubh Consultancy Services.`,
    pageType: 'page',
    service: '',
    serviceId: '',
    serviceName: '',
    category: 'Legal',
    state: '',
    city: '',
    status: 'live',
    seoStatus: 'pending',
    indexability: 'noindex',
    updatedAt: null,
    editability: 'not-connected',
    detailsHref: '/admin/pages',
    readOnlyReason: 'Final legal text has not been supplied yet.',
    source: 'next-route',
  }))

  const blogPages = (await listPublishedBlogs()).map((blog): PublicPageDescriptor => ({
    id: `public-blog-${blog.slug}`,
    pageId: `public-blog-${blog.slug}`,
    slug: blog.slug,
    title: blog.title,
    url: `/blog/${blog.slug}`,
    description: blogDescription(blog.content),
    publishedAt: blog.publishedAt || null,
    pageType: 'blog',
    service: '',
    serviceId: '',
    serviceName: '',
    category: 'Blog',
    state: '',
    city: '',
    status: 'live',
    seoStatus: 'ready',
    indexability: 'indexable',
    updatedAt: blog.updatedAt || blog.publishedAt || null,
    editability: 'editable',
    editorHref: '/admin/blog',
    source: 'next-route',
  }))

  return [...fixedPages, clientsPage, ...legalPages, ...categoryPages, ...servicePages, ...blogPages]
}

export async function eligiblePublicPages(): Promise<PublicPageDescriptor[]> {
  return (await discoverPublicPages()).filter((page) => {
    if (page.status !== 'live') return false
    if (page.indexability !== 'indexable') return false
    if (!page.url) return false
    if (page.url === '/admin' || page.url.startsWith('/admin')) return false
    if (page.url.startsWith('/api')) return false
    if (page.url === '/preview' || page.url.startsWith('/preview')) return false
    if (page.url === '/login' || page.url.startsWith('/login')) return false
    return true
  })
}

export function pageSearchText(page: PublicPageDescriptor) {
  return [
    page.title,
    page.slug,
    page.service,
    page.serviceName,
    page.category,
    page.state,
    page.city,
    page.pageType,
    page.url,
    page.id,
    page.pageId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[_/.-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
