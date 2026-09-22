import {
  ArrowRight,
  Check,
  Clock,
  FileText,
  MessageCircle,
  Phone,
  Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { contact, services } from '@/lib/site-data'
import { getRelatedServices } from '@/lib/service-clusters'
import { getServerServiceBuilderRecord } from '@/lib/server-services'
import { ServiceBuilderRenderer } from '@/components/service-builder-renderer'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await getServerServiceBuilderRecord(slug)
  const builderRecord = result.record
  if (builderRecord) {
    return {
      title: builderRecord.seo.seoTitle || builderRecord.pageTitle || builderRecord.serviceName,
      description: builderRecord.seo.metaDescription || builderRecord.shortDescription,
      alternates: builderRecord.seo.canonicalUrl ? { canonical: builderRecord.seo.canonicalUrl } : undefined,
      robots: {
        index: builderRecord.seo.robots.startsWith('index'),
        follow: builderRecord.seo.robots.endsWith('follow'),
      },
      openGraph: {
        title: builderRecord.seo.ogTitle || builderRecord.seo.seoTitle || builderRecord.serviceName,
        description: builderRecord.seo.ogDescription || builderRecord.seo.metaDescription || builderRecord.shortDescription,
        ...(builderRecord.seo.ogImage ? { images: [builderRecord.seo.ogImage] } : {}),
      },
    }
  }
  const service = services.find((s) => s.slug === slug)

  if (!service) return { title: result.source === 'unavailable' ? 'Service configuration unavailable' : 'Service not found', robots: { index: false, follow: false } }

  return {
    title: service.name,
    description: service.summary,
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await getServerServiceBuilderRecord(slug)
  if (result.source === 'unavailable') return <main className="min-h-[60vh] bg-surface px-4 py-20"><div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6"><p className="eyebrow">Service unavailable</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">Production service data is not configured</h1><p className="mt-3 text-sm text-amber-900">{result.error}</p></div></main>
  const builderRecord = result.record
  if (builderRecord) return <ServiceBuilderRenderer record={builderRecord} />
  const service = services.find((s) => s.slug === slug)

  if (!service) notFound()

  const related = getRelatedServices(service.slug)

  return (
    <>
      {/* ---------------------------------------------------------- HERO */}
      <section className="bg-primary">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-primary-foreground/60">
              <li>
                <Link href="/" className="hover:text-primary-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-primary-foreground/80">
                {service.category}
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-primary-foreground">
                {service.navLabel}
              </li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div className="flex flex-col gap-5">
              <span className="inline-flex w-fit items-center rounded-full bg-accent/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                {service.category}
              </span>
              <h1 className="text-balance font-serif text-3xl font-bold leading-tight text-primary-foreground md:text-4xl lg:text-5xl">
                {service.name}
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/75">
                {service.tagline}
              </p>

              <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t border-primary-foreground/15 pt-5">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/50">
                    Starting at
                  </dt>
                  <dd className="font-serif text-xl font-bold text-accent">
                    {service.startingAt}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/50">
                    Typical timeline
                  </dt>
                  <dd className="font-serif text-xl font-bold text-primary-foreground">
                    {service.timeline}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Enquiry card */}
            <aside className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur-sm">
              <h2 className="font-serif text-lg font-semibold text-primary-foreground">
                Speak to an expert
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">
                Get a written quote for {service.navLabel.toLowerCase()} with
                government and professional fees listed separately.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Button
                  nativeButton={false}
                  render={<a href={contact.phonePrimaryHref} />}
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  Call {contact.phonePrimary}
                </Button>
                <Button
                  nativeButton={false}
                  render={
                    <a
                      href={contact.whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                  size="lg"
                  variant="outline"
                  className="w-full border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Enquire on WhatsApp
                </Button>
              </div>

              <p className="mt-4 text-xs text-primary-foreground/50">
                {contact.hours}
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ MAIN BODY */}
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1fr_300px] lg:items-start">
        <article className="flex flex-col gap-12">
          {/* Overview */}
          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">
              Overview
            </h2>
            {service.intro.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-pretty leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </section>

          {/* Who needs it */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Users className="size-4.5" aria-hidden="true" />
              </span>
              <h2 className="font-serif text-2xl font-bold text-primary">
                Who needs this
              </h2>
            </div>
            <ul className="flex flex-col gap-3">
              {service.whoNeeds.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check
                    className="mt-0.5 size-4.5 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed text-muted-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Documents + Inclusions */}
          <div className="grid gap-6 md:grid-cols-2">
            <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <FileText className="size-4.5" aria-hidden="true" />
                </span>
                <h2 className="font-serif text-lg font-bold text-primary">
                  Documents required
                </h2>
              </div>
              <ul className="flex flex-col gap-3">
                {service.documents.map((doc) => (
                  <li key={doc} className="flex gap-3 text-sm">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed text-muted-foreground">
                      {doc}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Check className="size-4.5" aria-hidden="true" />
                </span>
                <h2 className="font-serif text-lg font-bold text-primary">
                  What is included
                </h2>
              </div>
              <ul className="flex flex-col gap-3">
                {service.inclusions.map((item) => (
                  <li key={item} className="flex gap-3 text-sm">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Process */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Clock className="size-4.5" aria-hidden="true" />
              </span>
              <h2 className="font-serif text-2xl font-bold text-primary">
                How the process works
              </h2>
            </div>
            <ol className="flex flex-col">
              {service.process.map((step, index) => (
                <li key={step.title} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    {index < service.process.length - 1 && (
                      <span
                        className="w-px flex-1 bg-border"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div
                    className={
                      index < service.process.length - 1
                        ? 'flex flex-col gap-1.5 pb-7'
                        : 'flex flex-col gap-1.5'
                    }
                  >
                    <h3 className="font-serif text-base font-semibold text-primary">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* FAQs */}
          <section className="flex flex-col gap-5">
            <h2 className="font-serif text-2xl font-bold text-primary">
              Frequently asked questions
            </h2>
            <Accordion className="rounded-xl border border-border bg-card px-5">
              {service.faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger className="py-4 font-serif text-base font-semibold text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </article>

        {/* ------------------------------------------------------- SIDEBAR */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-28">
          {related.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-base font-bold text-primary">
                Related in {service.category}
              </h2>
              <ul className="mt-4 flex flex-col gap-1">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/services/${item.slug}`}
                      className="group flex items-center gap-2 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      <ArrowRight
                        className="size-3.5 shrink-0 text-accent/50 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                      {item.navLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl bg-primary p-6">
            <h2 className="font-serif text-base font-bold text-primary-foreground">
              Need help deciding?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">
              Our team will confirm exactly which registration applies to your
              business — at no cost.
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <a
                href={contact.phonePrimaryHref}
                className="flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                <Phone className="size-4" aria-hidden="true" />
                {contact.phonePrimary}
              </a>
              <a
                href={contact.phoneSecondaryHref}
                className="flex items-center gap-2 text-sm font-medium text-accent hover:underline"
              >
                <Phone className="size-4" aria-hidden="true" />
                {contact.phoneSecondary}
              </a>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
