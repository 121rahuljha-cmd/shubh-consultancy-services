import { sitemapChunks } from '@/lib/page-scale'
import { eligiblePublicPages, type PublicPageDescriptor } from '@/lib/public-page-registry'
import { isEligibleSitemapPath, productionOrigin } from '@/lib/seo'

export const sitemapUrlLimit = 50000
export const sitemapSegments = ['pages', 'services', 'blog', 'locations'] as const
export type SitemapSegment = (typeof sitemapSegments)[number]

export type SitemapEntry = {
  url: string
  lastModified?: string
  changeFrequency: 'daily' | 'weekly' | 'monthly'
  priority: number
}

const segmentFor = (page: PublicPageDescriptor): SitemapSegment => {
  if (page.pageType === 'service') return 'services'
  if (page.pageType === 'blog') return 'blog'
  if (page.pageType === 'service-location') return 'locations'
  return 'pages'
}

const toEntry = (page: PublicPageDescriptor): SitemapEntry => ({
  url: `${productionOrigin()}${page.url}`,
  ...(page.updatedAt ? { lastModified: page.updatedAt } : {}),
  changeFrequency: page.pageType === 'blog' ? 'monthly' : 'weekly',
  priority: page.url === '/' ? 1 : page.pageType === 'service' ? 0.8 : 0.7,
})

export async function getSitemapEntries(segment: SitemapSegment) {
  const pages = await eligiblePublicPages()
  const seen = new Set<string>()
  return pages
    .filter((page) => segmentFor(page) === segment && isEligibleSitemapPath(page.url))
    .map(toEntry)
    .filter((entry) => {
      if (seen.has(entry.url)) return false
      seen.add(entry.url)
      return true
    })
}

export async function getSitemapChunks(segment: SitemapSegment) {
  const entries = await getSitemapEntries(segment)
  const byUrl = new Map(entries.map((entry) => [entry.url, entry]))
  const chunks = sitemapChunks(entries.map((entry) => entry.url), sitemapUrlLimit)
  return (chunks.length ? chunks : [[]])
    .map((urls) => urls.map((url) => byUrl.get(url)).filter((entry): entry is SitemapEntry => Boolean(entry)))
}

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export function sitemapXml(entries: SitemapEntry[]) {
  const body = entries.map((entry) => `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${escapeXml(entry.lastModified)}</lastmod>` : ''}<changefreq>${entry.changeFrequency}</changefreq><priority>${entry.priority}</priority></url>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export async function sitemapIndexXml() {
  const links = (await Promise.all(sitemapSegments.map(async (segment) => {
    const chunks = await getSitemapChunks(segment)
    return chunks.map((_, index) => `${productionOrigin()}/sitemap-${segment}.xml${chunks.length > 1 ? `?part=${index + 1}` : ''}`)
  }))).flat()
  const body = links.map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}