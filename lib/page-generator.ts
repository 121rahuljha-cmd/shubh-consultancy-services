import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createEmptyPage, type CmsPage } from '@/lib/page-cms'
import { discoverPublicPages } from '@/lib/public-page-registry'
import { services } from '@/lib/site-data'

export type GeneratedDraftSummary = {
  sourceUrl: string
  sourceIndex: number
  title: string
  slug: string
  pageType: CmsPage['pageType']
  serviceMatch?: string
  reason: string
}

export type GeneratedDraftBundle = {
  generated: CmsPage[]
  summary: GeneratedDraftSummary[]
  totalRows: number
  batchSize: number
}

const toSlug = (input: string) =>
  input
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/^www\./, '')
    .replace(/\.[a-z]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')

const titleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const matchService = (source: string) => {
  const normalized = source.toLowerCase()
  for (const service of services) {
    const candidates = [service.slug, service.name, service.navLabel, service.category]
    const haystack = candidates.join(' ').toLowerCase()
    if (normalized.includes(service.slug.toLowerCase()) || normalized.includes(service.name.toLowerCase())) return service
    const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean)
    if (tokens.some((token) => haystack.includes(token))) return service
  }
  return null
}

const sentenceCase = (value: string) => {
  const text = value.trim()
  if (!text) return 'Business compliance guidance'
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const fallbackDescription = (title: string) =>
  `${title} is a practical, search-friendly service page created as a draft for Shubh Consultancy Services. It is designed for entrepreneurs, founders and business owners who need clear compliance guidance, filing support and next-step recommendations.`

const overrideTitle = (title: string) => {
  if (/gst/i.test(title) && /registration/i.test(title)) return 'GST Registration Services'
  if (/company/i.test(title) && /registration/i.test(title)) return 'Company Registration Services'
  if (/trademark/i.test(title)) return 'Trademark Registration Services'
  return title
}

export function extractSourceUrls(csvText: string): string[] {
  return csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && /^https?:\/\//i.test(line))
    .slice(0, 100)
}

export async function generateBatchOneDrafts(): Promise<GeneratedDraftBundle> {
  const csvPath = path.join(process.cwd(), 'all.csv')
  const csvText = await fs.readFile(csvPath, 'utf8')
  const rows = extractSourceUrls(csvText)
  const publicPages = await discoverPublicPages()
  const existingSlugs = new Set(publicPages.map((page) => toSlug(page.slug)))

  const generated = rows.map((sourceUrl, index) => {
    const parsed = (() => {
      try {
        return new URL(sourceUrl)
      } catch {
        return null
      }
    })()

    const lastSegment = parsed ? parsed.pathname.split('/').filter(Boolean).pop() || 'page' : 'page'
    const rawTitle = lastSegment
      .replace(/\.(html|php)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim()

    const service = matchService(sourceUrl)
    const title = overrideTitle(titleCase(rawTitle || `Topic ${index + 1}`))
    const slug = toSlug(service ? service.slug : lastSegment || `topic-${index + 1}`)
    const pageType: CmsPage['pageType'] = service ? 'service' : parsed?.pathname.includes('/learn/') ? 'article' : 'page'

    const page = createEmptyPage()
    const uniqueId = `batch-1-${index + 1}-${slug || 'topic'}`
    const pageSlug = existingSlugs.has(slug) ? `${slug}-${index + 1}` : slug

    page.id = uniqueId
    page.title = title
    page.slug = pageSlug
    page.pageType = pageType
    page.status = 'draft'
    page.generationStatus = 'generated'
    page.seoStatus = 'pending'
    page.primaryKeyword = title
    page.secondaryKeywords = `${title}, ${service ? service.name : 'Shubh Consultancy Services'} business solutions, compliance support`
    page.searchIntent = 'informational'
    page.targetAudience = 'Founders, business owners, and professionals seeking compliant business support.'
    page.targetLocation = 'India'
    page.keywordVariations = `${title}, ${title.toLowerCase()}, ${service ? service.name : 'business support'} services`
    page.relatedTopics = service ? `${service.category}, business registration, compliance guidance` : 'Business registration, licensing, compliance, filing support'
    page.relatedEntities = 'Shubh Consultancy Services, MCA, GST, trademark, business compliance, filings'
    page.seoTitle = `${title} | Shubh Consultancy Services`
    page.metaDescription = fallbackDescription(title)
    page.canonicalUrl = `/${pageSlug}`
    page.robotsIndex = false
    page.robotsFollow = false
    page.ogTitle = `${title} | Shubh Consultancy Services`
    page.ogDescription = page.metaDescription
    page.twitterTitle = page.seoTitle
    page.twitterDescription = page.metaDescription
    page.h1 = title
    page.introduction = `${title} is an original draft page for Shubh Consultancy Services and is created to match the research intent behind the source URL while preserving the brand’s compliance-first guidance model.`
    page.overview = `${sentenceCase(title)} helps readers understand the topic in plain language, with practical next steps, compliance notes, and a clear path toward expert support from Shubh Consultancy Services.`
    page.mainContent = [
      `If you are searching for ${title}, you likely need clear, trustworthy guidance before making a filing, applying for a licence, or choosing a business structure. This draft provides the relevant context in a way that is useful for founders, small businesses, and professionals evaluating their next compliance step.`,
      `Shubh Consultancy Services helps individuals and businesses navigate regulatory requirements with a practical, document-driven approach. We simplify the process, explain the legal timelines, and guide clients through the paperwork that matters most to their business stage.`,
      `The goal of this page is to combine intent-led content with search relevance. It explains the issue, defines the decision points, and points visitors toward the right service or consultation route without overwhelming them with jargon.`,
      `For a personalised review, connect with our advisory team to understand whether your situation requires registration, online filing, annual compliance, or a broader business strategy conversation.`
    ].join('\n\n')
    page.serviceContent = {
      overview: `${title} is handled with clear guidance, structured paperwork support and a practical business-focused process.`,
      benefits: 'Clarity for founders and business owners\nFaster decision-making\nSupport for filing and compliance requirements',
      eligibility: 'Suitable for entrepreneurs, professionals, startups, and growing businesses seeking dependable assistance.',
      whoCanApply: 'Anyone evaluating a business registration, compliance filing, or licensing requirement can begin with this page.',
      documentsRequired: 'Documents vary by case. Our team will issue a tailored checklist after the initial consultation.',
      process: 'Consultation\nDocument collection\nFiling preparation\nSubmission support\nReview and follow-up',
      fees: 'Fee structures vary depending on the service scope, complexity, jurisdiction, and documentation required.',
      timeline: 'Most requests are reviewed within a short turnaround period, with timelines confirmed after intake.',
      validity: 'This page is intended as a draft and should be reviewed before publishing.',
      importantInformation: 'Requirements can differ by business type, location, and government filing stage. Always verify with current regulations before final submission.',
      commonMistakes: 'Delaying document collection\nChoosing the wrong structure\nSkipping a compliance check\nSubmitting incomplete forms',
      whyChooseUs: 'Shubh Consultancy Services focuses on clarity, responsiveness and business-ready guidance from start to finish.',
      conclusion: 'This page gives readers a practical overview and a clear route to a consultation, while staying in draft form until the team reviews the final copy.'
    }
    page.locationContent = {
      introduction: 'This draft is structured for India-focused business guidance and can be adapted for city, state or national variations when required.',
      serviceInformation: 'The messaging explains the issue clearly, emphasises practical next steps and prepares the visitor to enquire about support.',
      authority: 'The content is aligned to general business and compliance guidance and should be reviewed against any jurisdiction-specific requirements before publication.',
      process: 'Review topic, customise detail, confirm jurisdiction, and add final compliance notes where required.',
      documents: 'A personalised document checklist is recommended before final publishing or service assignment.',
      faqs: 'FAQ content can be expanded based on the actual filing requirement and the target audience.',
      contact: 'Readers can contact Shubh Consultancy Services for a tailored discussion and document review.'
    }
    page.blocks = [{
      id: crypto.randomUUID(),
      type: 'rich-text',
      title: 'Overview',
      content: `${page.overview}\n\n${page.mainContent}`,
      settings: {},
      displayOrder: 1,
      status: 'active'
    }]
    page.faqs = [{
      id: crypto.randomUUID(),
      question: `What does ${title} involve?`,
      answer: `${title} typically requires a clear understanding of the filing, paperwork, and business context involved. Shubh Consultancy Services can help you assess the right path and prepare the supporting documentation.`,
      status: 'draft',
      displayOrder: 1
    }]
    page.featuredImage = { image: '', altText: title, title: title, caption: `${title} draft page for Shubh Consultancy Services`, description: page.metaDescription }
    page.internalLinks = {
      relatedServices: [],
      popularSearches: [],
      relatedGuides: [],
      relatedBlogs: [],
      stateLinks: [],
      cityLinks: [],
      customLinks: [
        { id: crypto.randomUUID(), anchorText: 'Shubh Consultancy Services', url: '/', description: 'Visit the main Shubh Consultancy Services website', openInNewTab: false, status: 'active', displayOrder: 1 },
        { id: crypto.randomUUID(), anchorText: 'Contact us', url: '/contact', description: 'Speak to Shubh about your compliance or registration requirements', openInNewTab: false, status: 'active', displayOrder: 2 },
        { id: crypto.randomUUID(), anchorText: 'All services', url: '/services', description: 'Browse available Shubh business services', openInNewTab: false, status: 'active', displayOrder: 3 }
      ]
    }
    page.schema.webPage = 'auto'
    page.breadcrumbs = { manualOverride: false, items: ['Home', title] }
    page.sitemap.include = false
    page.sitemap.priority = '0.5'
    page.sitemap.changeFrequency = 'monthly'
    page.indexingStatus = 'draft only'
    return page
  })

  const summary = generated.map((page, index) => ({
    sourceUrl: rows[index],
    sourceIndex: index + 1,
    title: page.title,
    slug: page.slug,
    pageType: page.pageType,
    serviceMatch: matchService(rows[index])?.slug,
    reason: matchService(rows[index]) ? 'Matched an existing Shubh service pattern' : 'Created as a new draft article/page',
  }))

  return { generated, summary, totalRows: rows.length, batchSize: rows.length }
}

export async function readBatchOneSourceUrls() {
  const csvPath = path.join(process.cwd(), 'all.csv')
  const text = await fs.readFile(csvPath, 'utf8')
  return extractSourceUrls(text)
}
