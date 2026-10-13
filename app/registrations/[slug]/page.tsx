import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, FileText, MessageCircle, Phone } from 'lucide-react'
import { registrationPages } from '@/lib/registration-pages'
import { contact } from '@/lib/site-data'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = registrationPages.find((item) => item.slug === slug)
  if (!page) return { title: 'Registration service not found', robots: { index: false, follow: false } }
  return { title: `${page.title} | Shubh Consultancy Services`, description: page.summary, alternates: { canonical: `/registrations/${page.slug}` }, robots: { index: false, follow: true }, openGraph: { title: `${page.title} | Shubh Consultancy Services`, description: page.summary, type: 'website' } }
}

export default async function RegistrationPage({ params }: Props) {
  const { slug } = await params
  const page = registrationPages.find((item) => item.slug === slug)
  if (!page) notFound()
  const related = registrationPages.filter((item) => item.slug !== page.slug).slice(0, 10)
  const popularSlugs = ['fssai-registration', 'fssai-license', 'trade-license', 'import-export-code', 'udyam-registration', 'shop-act-registration', 'iso-registration', 'digital-signature', 'gst-registration', 'startup-india-registration']
  const popular = popularSlugs.map((slug) => registrationPages.find((item) => item.slug === slug)).filter((item): item is (typeof registrationPages)[number] => Boolean(item) && item.slug !== page.slug).slice(0, 10)
  return <main className="min-h-screen bg-background">
    <section className="bg-primary text-primary-foreground"><div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-primary-foreground/70"><Link href="/" className="hover:text-primary-foreground">Home</Link><span className="mx-2">/</span><Link href="/services" className="hover:text-primary-foreground">Services</Link><span className="mx-2">/</span><span>Registrations</span><span className="mx-2">/</span><span className="text-primary-foreground">{page.title}</span></nav>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Registration &amp; compliance support</p><h1 className="mt-4 max-w-4xl font-serif text-3xl font-bold leading-tight md:text-5xl">{page.title}</h1><p className="mt-5 max-w-3xl text-lg leading-relaxed text-primary-foreground/80">{page.summary}</p>
      <div className="mt-8 flex flex-wrap gap-3"><a href={contact.phonePrimaryHref} className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 font-bold text-white hover:bg-brand-hover"><Phone className="size-4" /> Discuss your requirement</a><a href={contact.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 px-5 py-3 font-bold text-primary-foreground hover:bg-primary-foreground/10"><MessageCircle className="size-4" /> WhatsApp</a></div>
    </div></section>
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-14">
      <article className="min-w-0">
        <section className="mb-10"><h2 className="font-serif text-2xl font-bold text-navy md:text-3xl">Understanding {page.title}</h2><p className="mt-4 leading-7 text-muted-foreground">{page.purpose}</p><p className="mt-4 leading-7 text-muted-foreground">The correct application route depends on your legal structure, business activity, location and the rules currently followed by the competent authority. Before submitting an application, confirm the latest official checklist and whether any additional licence, registration or approval applies to your case.</p></section>
        <section className="mb-10 rounded-xl border border-border bg-card p-6"><h2 className="font-serif text-xl font-bold text-navy">Who may need this service?</h2><ul className="mt-4 space-y-3">{page.whoNeeds.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 size-4 shrink-0 text-brand" />{item}</li>)}</ul></section>
        <section className="mb-10"><h2 className="font-serif text-2xl font-bold text-navy">Documents to prepare</h2><p className="mt-3 leading-7 text-muted-foreground">Use this as an initial checklist only. The final list can change based on applicant type, authority and current portal requirements.</p><ul className="mt-4 space-y-3">{page.documents.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><FileText className="mt-1 size-4 shrink-0 text-brand" />{item}</li>)}</ul></section>
        <section className="mb-10"><h2 className="font-serif text-2xl font-bold text-navy">Typical application process</h2><ol className="mt-5 space-y-4">{page.steps.map((step, index) => <li key={step} className="flex gap-4 rounded-lg border border-border p-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-tint font-bold text-brand">{index + 1}</span><div><h3 className="font-semibold text-navy">{step}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">The exact sequence depends on the applicable scheme and authority. Required clarifications or inspections may add steps.</p></div></li>)}</ol></section>
        <section className="mb-10"><h2 className="font-serif text-2xl font-bold text-navy">Frequently asked questions</h2><div className="mt-4 divide-y divide-border rounded-xl border border-border">{page.faqs.map((faq) => <details key={faq.question} className="group p-5"><summary className="cursor-pointer list-none pr-6 font-semibold text-navy">{faq.question}<span className="float-right text-brand group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p></details>)}</div></section>
        <section className="rounded-xl bg-brand-tint p-6"><h2 className="font-serif text-2xl font-bold text-navy">Need help with {page.title.toLowerCase()}?</h2><p className="mt-3 leading-7 text-muted-foreground">Tell us your business type, state and intended activity. We can help you identify the relevant checklist and next steps before you proceed.</p><div className="mt-5 flex flex-wrap gap-3"><a href={contact.phonePrimaryHref} className="rounded-md bg-brand px-4 py-3 text-sm font-bold text-white">Call Shubh Consultancy</a><a href={contact.whatsappHref} target="_blank" rel="noreferrer" className="rounded-md border border-brand px-4 py-3 text-sm font-bold text-brand">WhatsApp enquiry</a></div></section>
        <p className="mt-6 text-xs leading-5 text-muted-foreground">Information on this page is general guidance, not a guarantee of approval or processing time. Official eligibility, fees, documents and timelines should be verified with the relevant authority before filing.</p>
      </article>
      <aside className="h-fit space-y-6 lg:sticky lg:top-28">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-lg font-bold text-navy">Related services</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Explore connected registrations and compliance services that may apply to your business. Applicability depends on your activity and location.</p>
          <div className="mt-4 grid gap-2">{related.map((item) => <Link key={item.slug} href={`/registrations/${item.slug}`} className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-navy transition hover:border-brand hover:bg-brand-tint hover:text-brand"><span>{item.title}</span><ArrowRight className="size-3.5 shrink-0" /></Link>)}</div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-lg font-bold text-navy">Popular services</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Frequently explored services for startups, food businesses, shops, exporters and growing organisations.</p>
          <div className="mt-4 grid gap-2">{popular.map((item) => <Link key={item.slug} href={`/registrations/${item.slug}`} className="flex min-h-10 items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-navy transition hover:bg-brand-tint hover:text-brand"><span>{item.title}</span><ArrowRight className="size-3.5 shrink-0" /></Link>)}</div>
          <Link href="/services" className="mt-4 block border-t border-border pt-4 text-sm font-bold text-brand hover:underline">View all services</Link>
        </section>
      </aside>
    </div>
  </main>
}
