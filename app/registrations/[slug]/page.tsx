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
import { contact, getVisibleContactNumbers } from '@/lib/site-data'
import { registrationPages } from '@/lib/registration-pages'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = registrationPages.find((item) => item.slug === slug)
  if (!page) return { title: 'Registration service not found', robots: { index: false, follow: false } }
  return {
    title: `${page.title} | Shubh Consultancy Services`,
    description: page.summary,
    alternates: { canonical: `/registrations/${page.slug}` },
    robots: { index: false, follow: true },
    openGraph: { title: `${page.title} | Shubh Consultancy Services`, description: page.summary, type: 'website' },
  }
}

export default async function RegistrationPage({ params }: Props) {
  const { slug } = await params
  const page = registrationPages.find((item) => item.slug === slug)
  if (!page) notFound()

  const visiblePhones = getVisibleContactNumbers()
  const related = registrationPages.filter((item) => item.slug !== page.slug).slice(0, 10)
  const popularSlugs = ['fssai-registration', 'fssai-license', 'trade-license', 'import-export-code', 'udyam-registration', 'shop-act-registration', 'iso-registration', 'digital-signature', 'startup-india-registration', 'rcmc-registration']
  const popular = [...popularSlugs.map((popularSlug) => registrationPages.find((item) => item.slug === popularSlug)), ...registrationPages.filter((item) => !popularSlugs.includes(item.slug))]
    .filter((item): item is (typeof registrationPages)[number] => Boolean(item) && item.slug !== page.slug)
    .slice(0, 10)

  return (
    <>
      {/* Registration hero follows the existing service-page layout; only page content and SEO vary. */}
      <section className="bg-primary">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-primary-foreground/60">
              <li><Link href="/" className="hover:text-primary-foreground">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/services" className="hover:text-primary-foreground">Services</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-primary-foreground/80">Registrations</li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-primary-foreground">{page.title}</li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div className="flex flex-col gap-5">
              <span className="inline-flex w-fit items-center rounded-full bg-accent/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                Registration &amp; compliance
              </span>
              <h1 className="text-balance font-serif text-3xl font-bold leading-tight text-primary-foreground md:text-4xl lg:text-5xl">
                {page.title}
              </h1>
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/75">
                {page.summary}
              </p>
              <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t border-primary-foreground/15 pt-5">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/50">Service support</dt>
                  <dd className="font-serif text-xl font-bold text-accent">Application guidance</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wider text-primary-foreground/50">Next step</dt>
                  <dd className="font-serif text-xl font-bold text-primary-foreground">Eligibility review</dd>
                </div>
              </dl>
            </div>

            <aside className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur-sm">
              <h2 className="font-serif text-lg font-semibold text-primary-foreground">Speak to our team</h2>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">
                Discuss your requirements for {page.title.toLowerCase()}. We can help you check the likely route and prepare the relevant documents.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Button nativeButton={false} render={<a href={contact.phonePrimaryHref} />} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Phone className="size-4" aria-hidden="true" /> Call {contact.phonePrimary}
                </Button>
                <Button nativeButton={false} render={<a href={contact.whatsappHref} target="_blank" rel="noreferrer" />} size="lg" variant="outline" className="w-full border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <MessageCircle className="size-4" aria-hidden="true" /> Enquire on WhatsApp
                </Button>
              </div>
              <p className="mt-4 text-xs text-primary-foreground/50">{contact.hours}</p>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[1fr_300px] lg:items-start">
        <article className="flex flex-col gap-12">
          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">Overview</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">{page.purpose}</p>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              The correct application route depends on your legal structure, business activity, location and the rules currently followed by the competent authority. Before applying, verify the latest official checklist, eligibility criteria and any additional approvals relevant to your case.
            </p>
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Users className="size-4.5" aria-hidden="true" /></span>
              <h2 className="font-serif text-2xl font-bold text-primary">Who needs this</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {page.whoNeeds.map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 size-4.5 shrink-0 text-accent" aria-hidden="true" /><span className="leading-relaxed text-muted-foreground">{item}</span></li>)}
            </ul>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><FileText className="size-4.5" aria-hidden="true" /></span>
                <h2 className="font-serif text-lg font-bold text-primary">Documents required</h2>
              </div>
              <ul className="flex flex-col gap-3">
                {page.documents.map((item) => <li key={item} className="flex gap-3 text-sm"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" /><span className="leading-relaxed text-muted-foreground">{item}</span></li>)}
              </ul>
              <p className="text-xs leading-relaxed text-muted-foreground">This is an initial checklist. The final requirements can vary by applicant, authority and current portal rules.</p>
            </section>

            <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Check className="size-4.5" aria-hidden="true" /></span>
                <h2 className="font-serif text-lg font-bold text-primary">Application checklist</h2>
              </div>
              <ul className="flex flex-col gap-3">
                {page.steps.map((item) => <li key={item} className="flex gap-3 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" /><span className="leading-relaxed text-muted-foreground">{item}</span></li>)}
              </ul>
            </section>
          </div>

          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Clock className="size-4.5" aria-hidden="true" /></span>
              <h2 className="font-serif text-2xl font-bold text-primary">How the process works</h2>
            </div>
            <ol className="flex flex-col">
              {page.steps.map((step, index) => <li key={step} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-primary-foreground">{index + 1}</span>
                  {index < page.steps.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
                </div>
                <div className={index < page.steps.length - 1 ? 'flex flex-col gap-1.5 pb-7' : 'flex flex-col gap-1.5'}>
                  <h3 className="font-serif text-base font-semibold text-primary">{step}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">Our team can help review the applicable checklist and prepare the information required for this stage. The authority may request additional documents, inspection or clarification.</p>
                </div>
              </li>)}
            </ol>
          </section>

          <section className="flex flex-col gap-5">
            <h2 className="font-serif text-2xl font-bold text-primary">Frequently asked questions</h2>
            <Accordion className="rounded-xl border border-border bg-card px-5">
              {page.faqs.map((faq, index) => <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="py-4 font-serif text-base font-semibold text-primary">{faq.question}</AccordionTrigger>
                <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>)}
            </Accordion>
          </section>

          <section className="rounded-xl bg-primary p-6">
            <h2 className="font-serif text-2xl font-bold text-primary-foreground">Need help with {page.title}?</h2>
            <p className="mt-3 leading-relaxed text-primary-foreground/75">Share your business type, state and intended activity. Shubh Consultancy Services can help you understand the relevant checklist and next steps. Final approval remains with the competent authority.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button nativeButton={false} render={<a href={contact.phonePrimaryHref} />} className="bg-accent text-accent-foreground hover:bg-accent/90"><Phone className="size-4" aria-hidden="true" /> Call our team</Button>
              <Button nativeButton={false} render={<a href={contact.whatsappHref} target="_blank" rel="noreferrer" />} variant="outline" className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><MessageCircle className="size-4" aria-hidden="true" /> WhatsApp enquiry</Button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-primary-foreground/55">{contact.hours}</p>
          </section>
          <p className="text-xs leading-relaxed text-muted-foreground">This page provides general information and is not a guarantee of eligibility, approval or processing time. Verify current rules, fees and documents with the relevant authority before filing.</p>
        </article>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-28">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-base font-bold text-primary">Related registration services</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Explore other services that may connect to your business requirements.</p>
            <ul className="mt-4 flex flex-col gap-1">
              {related.map((item) => <li key={item.slug}><Link href={`/registrations/${item.slug}`} className="group flex items-center gap-2 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-accent"><ArrowRight className="size-3.5 shrink-0 text-accent/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />{item.title}</Link></li>)}
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-base font-bold text-primary">Popular services</h2>
            <ul className="mt-4 flex flex-col gap-1">
              {popular.map((item) => <li key={item.slug}><Link href={`/registrations/${item.slug}`} className="group flex items-center gap-2 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-accent"><ArrowRight className="size-3.5 shrink-0 text-accent/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />{item.title}</Link></li>)}
            </ul>
            <Link href="/services" className="mt-4 block border-t border-border pt-4 text-sm font-bold text-accent hover:underline">View all services</Link>
          </section>
          <section className="rounded-xl bg-primary p-6">
            <h2 className="font-serif text-base font-bold text-primary-foreground">Need help deciding?</h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">Contact our team to discuss the right registration route for your business.</p>
            <div className="mt-4 flex flex-col gap-2.5">
              {visiblePhones.map((phone) => <a key={`${phone.formatted}-${phone.href}`} href={phone.href} className="flex items-center gap-2 text-sm font-medium text-accent hover:underline"><Phone className="size-4" aria-hidden="true" />{phone.formatted}</a>)}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
