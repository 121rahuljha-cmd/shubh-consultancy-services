import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PublicLinkingSection } from '@/components/public-linking-section'
import { getBlogBySlug } from '@/lib/database-repository'

export const dynamic = 'force-dynamic'

const pickText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) return value.map((item) => pickText(item)).filter(Boolean).join('\n\n')
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['content', 'body', 'text', 'summary', 'description', 'intro', 'markdown', 'html']) {
      if (typeof record[key] !== 'undefined') {
        const result = pickText(record[key])
        if (result) return result
      }
    }
    return Object.values(record)
      .map((item) => pickText(item))
      .filter(Boolean)
      .join('\n\n')
  }
  return ''
}

function BlogBody({ value }: { value: unknown }) {
  if (typeof value === 'string') {
    return <p className="whitespace-pre-line leading-8 text-base text-muted-foreground">{value}</p>
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-6">
        {value.map((item, index) => (
          <BlogBody key={`${typeof item}-${index}`} value={item} />
        ))}
      </div>
    )
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const sections = Array.isArray(record.sections)
      ? record.sections
      : Array.isArray(record.blocks)
        ? record.blocks
        : Array.isArray(record.items)
          ? record.items
          : []

    if (sections.length) {
      return (
        <div className="space-y-8">
          {sections.map((section, index) => {
            const sectionRecord = section as Record<string, unknown>
            const title = typeof sectionRecord.heading === 'string' ? sectionRecord.heading : typeof sectionRecord.title === 'string' ? sectionRecord.title : ''
            const body = pickText(sectionRecord.content ?? sectionRecord.body ?? sectionRecord.text ?? sectionRecord.description ?? sectionRecord.summary)
            return (
              <section key={`${title || 'section'}-${index}`} className="space-y-3">
                {title ? <h2 className="font-serif text-2xl font-bold text-navy">{title}</h2> : null}
                {body ? <div className="space-y-4">{body.split(/\n\s*\n/).filter(Boolean).map((paragraph, paragraphIndex) => <p key={`${title}-${paragraphIndex}`} className="leading-8 text-base text-muted-foreground">{paragraph}</p>)}</div> : null}
              </section>
            )
          })}
        </div>
      )
    }

    for (const key of ['title', 'heading', 'label']) {
      if (typeof record[key] === 'string' && record[key]) {
        return (
          <div className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-navy">{record[key]}</h2>
            {(() => {
              const body = pickText(record.body ?? record.content ?? record.text ?? record.summary ?? record.description)
              return body ? <p className="whitespace-pre-line leading-8 text-base text-muted-foreground">{body}</p> : null
            })()}
          </div>
        )
      }
    }

    for (const key of ['body', 'content', 'text', 'summary', 'description', 'intro', 'markdown']) {
      if (typeof record[key] !== 'undefined') {
        return <BlogBody value={record[key]} />
      }
    }

    return (
      <div className="space-y-3">
        {Object.entries(record).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand">{key}</h3>
            <BlogBody value={value} />
          </div>
        ))}
      </div>
    )
  }

  return null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const blog = await getBlogBySlug(slug)

  if (!blog || String(blog.status).toLowerCase() !== 'published') {
    return { title: 'Blog not found', robots: { index: false, follow: false } }
  }

  const seo = blog.seo && typeof blog.seo === 'object' ? blog.seo as Record<string, unknown> : {}
  const description = typeof seo.metaDescription === 'string' && seo.metaDescription ? seo.metaDescription : pickText(blog.content).slice(0, 160)
  const canonical = typeof seo.canonicalUrl === 'string' && seo.canonicalUrl ? seo.canonicalUrl : `/blog/${slug}`
  const index = seo.robotsIndex !== false
  const follow = seo.robotsFollow !== false

  return {
    title: typeof seo.seoTitle === 'string' && seo.seoTitle ? seo.seoTitle : blog.title,
    description: description || 'Read this article on the Shubh Consultancy Services blog.',
    alternates: { canonical },
    robots: { index, follow },
    openGraph: {
      title: typeof seo.ogTitle === 'string' && seo.ogTitle ? seo.ogTitle : blog.title,
      description: typeof seo.ogDescription === 'string' && seo.ogDescription ? seo.ogDescription : description || 'Read this article on the Shubh Consultancy Services blog.',
      url: canonical,
      ...(typeof seo.ogImage === 'string' && seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
    twitter: {
      card: typeof seo.twitterImage === 'string' && seo.twitterImage ? 'summary_large_image' : 'summary',
      title: typeof seo.twitterTitle === 'string' && seo.twitterTitle ? seo.twitterTitle : blog.title,
      description: typeof seo.twitterDescription === 'string' && seo.twitterDescription ? seo.twitterDescription : description,
      ...(typeof seo.twitterImage === 'string' && seo.twitterImage ? { images: [seo.twitterImage] } : {}),
    },
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const blog = await getBlogBySlug(slug)

  if (!blog || String(blog.status).toLowerCase() !== 'published') notFound()

  const pageId = `public-blog-${blog.slug}`
  const seo = blog.seo && typeof blog.seo === 'object' ? blog.seo as Record<string, unknown> : {}
  const featuredImage = blog.featuredImage && typeof blog.featuredImage === 'object' ? blog.featuredImage as Record<string, unknown> : {}
  const summary = typeof blog.excerpt === 'string' && blog.excerpt ? blog.excerpt : pickText(blog.content).slice(0, 180) || 'Read this article on the Shubh Consultancy Services blog.'
  const contentRecord = blog.content && typeof blog.content === 'object' ? blog.content as Record<string, unknown> : {}
  const faqs = seo.faqs && Array.isArray(seo.faqs) ? (seo.faqs as Array<Record<string, unknown>>).filter(faq => faq.status === 'active' && typeof faq.question === 'string' && typeof faq.answer === 'string') : []
  const schemaSettings = seo.schema && typeof seo.schema === 'object' ? seo.schema as Record<string, unknown> : {}
  const articleSchema = schemaSettings.article !== 'disabled'
  const faqSchema = schemaSettings.faqPage !== 'disabled' && faqs.length > 0

  return (
    <main className="bg-surface">
      {articleSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: blog.title, description: summary, datePublished: blog.publishedAt || blog.createdAt, dateModified: blog.updatedAt, author: { '@type': 'Organization', name: blog.author || 'Shubh Consultancy Services' }, image: typeof featuredImage.image === 'string' && featuredImage.image ? [featuredImage.image] : undefined, mainEntityOfPage: { '@type': 'WebPage', '@id': typeof seo.canonicalUrl === 'string' && seo.canonicalUrl ? seo.canonicalUrl : `/blog/${slug}` } }) }} />}
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }) }} />}
      <article className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8">
          <Link href="/blog" className="text-sm font-semibold text-brand hover:underline">
            ← Back to Blog
          </Link>
        </div>

        <header className="mb-8 border-b border-border pb-8">
          <p className="eyebrow">Blog</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-navy md:text-5xl">{blog.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {new Date(blog.publishedAt || blog.updatedAt || Date.now()).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{summary}</p>
          {typeof featuredImage.image === 'string' && featuredImage.image && <figure className="mt-6"><img src={featuredImage.image} alt={typeof featuredImage.altText === 'string' ? featuredImage.altText : ''} className="max-h-[480px] w-full rounded-xl object-cover" />{typeof featuredImage.caption === 'string' && featuredImage.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{featuredImage.caption}</figcaption>}</figure>}
        </header>

        {typeof contentRecord.introduction === 'string' && contentRecord.introduction && <p className="mb-8 whitespace-pre-line text-lg leading-8 text-muted-foreground">{contentRecord.introduction}</p>}
        <div className="space-y-8">
          <BlogBody value={blog.content} />
        </div>
      </article>

      <div className="mt-8">
        <PublicLinkingSection pageId={pageId} />
      </div>
    </main>
  )
}
