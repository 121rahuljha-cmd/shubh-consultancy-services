import { eligiblePublicPages, type PublicPageDescriptor } from '@/lib/public-page-registry'
import { isEligibleSitemapPath, productionOrigin } from '@/lib/seo'

type LlmPage = PublicPageDescriptor & { absoluteUrl: string }

export async function getLlmPages(): Promise<LlmPage[]> {
  const seen = new Set<string>()
  return (await eligiblePublicPages())
    .filter((page) => isEligibleSitemapPath(page.url))
    .map((page) => ({ ...page, absoluteUrl: `${productionOrigin()}${page.url}` }))
    .filter((page) => {
      if (seen.has(page.absoluteUrl)) return false
      seen.add(page.absoluteUrl)
      return true
    })
}

const clean = (value: string | undefined | null) => (value || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
const link = (page: LlmPage) => `- [${clean(page.title)}](${page.absoluteUrl})${page.description ? `: ${clean(page.description)}` : '.'}`
const pagesOfType = (pages: LlmPage[], pageType: LlmPage['pageType']) => pages.filter((page) => page.pageType === pageType)

export async function renderLlmsText(full = false) {
  const pages = await getLlmPages()
  const mainPages = pagesOfType(pages, 'page')
  const services = pagesOfType(pages, 'service')
  const blogs = pagesOfType(pages, 'blog')
  const locations = pagesOfType(pages, 'service-location')
  const header = [
    '# Shubh Consultancy Services',
    '',
    '> Shubh Consultancy Services provides company registration, compliance, tax, licensing and digital marketing services across India.',
    '',
  ]

  if (full) {
    const fullSections = [
      ...header,
      '## Website',
      '',
      ...(mainPages.length ? mainPages.map(link) : []),
      ...(services.length ? ['', '## Services', '', ...services.flatMap((page) => [`### ${clean(page.title)}`, `- URL: ${page.absoluteUrl}`, `- Description: ${clean(page.description) || 'No additional description is available.'}`, `- Category: ${clean(page.category) || 'Not specified.'}`])] : []),
      ...(blogs.length ? ['', '## Blogs', '', ...blogs.flatMap((page) => [`### ${clean(page.title)}`, `- URL: ${page.absoluteUrl}`, `- Description: ${clean(page.description) || 'No excerpt is available.'}`, ...(page.publishedAt ? [`- Published: ${clean(page.publishedAt)}`] : [])])] : []),
      ...(locations.length ? ['', '## Locations', '', ...locations.flatMap((page) => [`### ${clean(page.title)}`, `- URL: ${page.absoluteUrl}`, `- Description: ${clean(page.description) || 'No additional description is available.'}`, ...(page.state || page.city ? [`- Location: ${clean([page.city, page.state].filter(Boolean).join(', '))}`] : [])])] : []),
    ]
    return `${fullSections.join('\n')}\n`
  }

  const sections = [
    ...header,
    '## Main Pages',
    '',
    ...(mainPages.length ? mainPages.map(link) : []),
    ...(services.length ? ['', '## Services', '', ...services.map(link)] : []),
    ...(blogs.length ? ['', '## Blog', '', ...blogs.map(link)] : []),
    ...(locations.length ? ['', '## Locations', '', ...locations.map(link)] : []),
  ]
  return `${sections.join('\n')}\n`
}