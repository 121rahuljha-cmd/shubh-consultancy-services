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


          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">When should you consider {page.title}?</h2>
            <p className="leading-relaxed text-muted-foreground">The right time to explore {page.title.toLowerCase()} is before a business commitment makes the requirement urgent. A new venture may need to complete formalities before beginning operations, signing a contract, onboarding to a marketplace, participating in a tender or supplying a customer. An established organisation may need to review its status when its activities, premises, ownership, workforce, product range or target market changes. These are useful triggers for a compliance review, but they do not by themselves prove that a particular registration is compulsory. The applicable law, scheme, state, local authority and facts of the applicant must be checked. Shubh Consultancy Services can help organise the questions and documents needed for that review, so you can make a better-informed decision before submitting information to a government portal or certifying body.</p>
            <p className="leading-relaxed text-muted-foreground">Start by describing what the business actually does, where it operates, who owns or manages it, and which customers or markets it serves. Include planned activities as well as current operations if the registration is being considered before launch. A name that sounds similar to another licence is not enough to establish equivalence: different registrations can serve different purposes, be issued by different bodies and carry different conditions. In some cases a business may need more than one approval; in others, a registration may not apply at all. Checking the scope early can help prevent duplicate applications, avoidable fees, inconsistent declarations and delays caused by selecting the wrong category.</p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">Eligibility and applicability checks</h2>
            <p className="leading-relaxed text-muted-foreground">Eligibility for {page.title.toLowerCase()} should be assessed against the current requirements of the relevant authority or scheme. Depending on the service, important factors may include the legal form of the applicant, place of business, nature of activity, scale of operations, product or service category, ownership details, employee information, technical standards or existing registrations. The same checklist may not suit a sole proprietor, partnership, company, trust, society, manufacturer, importer and service provider. State and municipal requirements can also differ. Do not rely on an old checklist or an example from another business without confirming that the circumstances match your own.</p>
            <p className="leading-relaxed text-muted-foreground">Before applying, check the official portal guidance and the current form instructions. Confirm which applicant details must match government records, whether an authorised signatory is required, what supporting evidence is accepted and whether a separate inspection, test report, professional certificate or prior approval is relevant. Where the rules are unclear, record the precise question and seek clarification from the competent authority or a qualified adviser. This page provides general guidance to help you prepare; it does not replace official rules or determine legal eligibility. Final applicability should be confirmed from up-to-date sources and the facts of the particular case.</p>
            <ul className="flex flex-col gap-3">{page.whoNeeds.map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 size-4.5 shrink-0 text-accent" aria-hidden="true" /><span className="leading-relaxed text-muted-foreground">{item}</span></li>)}</ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">Benefits of preparing correctly</h2>
            <p className="leading-relaxed text-muted-foreground">A well-prepared application gives the reviewer a clearer picture of the applicant and the activity for which approval is being sought. Consistent names, addresses, dates and entity details reduce avoidable clarification requests. A complete document set also makes it easier to track what was submitted, which version was used and whether the authority has asked for further evidence. For a business, this organised approach can support smoother onboarding with customers, marketplaces, banks or other counterparties when they request the relevant certificate or registration details. The actual benefit depends on the service: no registration automatically guarantees a contract, tax benefit, loan, export order or government approval.</p>
            <p className="leading-relaxed text-muted-foreground">Planning also helps a business understand the work that may continue after registration. Some approvals require renewal, periodic returns, fee payments, records, audits, product testing, changes to the registered particulars or notifications when circumstances change. Other processes are one-time but still require the holder to follow the conditions stated on the certificate or by the issuing body. Before proceeding, ask what evidence will be issued, how it should be verified, who must keep it, when it expires if applicable and which ongoing duties may follow. Treat these questions as part of the decision rather than something to consider only after an application has been approved.</p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">Documents and information to organise</h2>
            <p className="leading-relaxed text-muted-foreground">Use the document list above as a starting point, not as a universal or final checklist. The authority may request different evidence depending on the applicant category and the service. Check that documents are readable, current where required and consistent with the information entered in the form. If the application uses an address, verify that the same address is supported by the relevant proof and that the premises details are entered in the correct fields. If an entity name, director, partner, trustee or authorised signatory is involved, confirm that the person has authority to make the declaration or submit the application.</p>
            <p className="leading-relaxed text-muted-foreground">Keep a simple preparation folder containing the latest documents, application draft, payment acknowledgement if any, submission receipt, reference number and later correspondence. Use clear filenames and avoid mixing old and current versions. Do not alter a certificate or supporting record to make it appear to meet a requirement. If a document contains an error, follow the issuing body's correction process or ask what alternative evidence is accepted. Share personal and business documents only through appropriate, secure channels and only with people who need them for the application. Additional evidence should be supplied when requested by the relevant authority and in the format it specifies.</p>
            <ul className="flex flex-col gap-3">{page.documents.map((item) => <li key={item} className="flex gap-3 text-sm"><FileText className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" /><span className="leading-relaxed text-muted-foreground">{item}</span></li>)}</ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">Application process: from review to submission</h2>
            <p className="leading-relaxed text-muted-foreground">A practical application workflow begins with a short requirement review. Identify the competent authority, the purpose of the application, the applicant category and any preconditions that must be completed first. Next, prepare the documents and compare every important field against the supporting records. Enter information carefully and review declarations before they are signed or submitted. Where the process requires a fee, use the official payment route and retain the acknowledgement. After submission, save the application number and monitor the official portal or communication channel for status updates, requests for clarification, inspection instructions or additional steps.</p>
            <p className="leading-relaxed text-muted-foreground">The steps below describe a general workflow for {page.title.toLowerCase()}; the exact order can differ by scheme and authority. Some applications are fully online, while others may involve physical verification, sample testing, an inspection, an appointment or communication with a designated office. If a clarification is issued, read it carefully, note the response deadline if one is specified and provide evidence that directly answers the question. Do not create a second application simply because the first one is taking time unless the official process or authority advises you to do so. Keep a record of submissions and replies so the case history remains clear.</p>
            <ol className="flex flex-col">{page.steps.map((step, index) => <li key={step} className="flex gap-5"><div className="flex flex-col items-center"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-serif text-sm font-bold text-primary-foreground">{index + 1}</span>{index < page.steps.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden="true" />}</div><div className={index < page.steps.length - 1 ? 'flex flex-col gap-1.5 pb-7' : 'flex flex-col gap-1.5'}><h3 className="font-serif text-base font-semibold text-primary">{step}</h3><p className="text-sm leading-relaxed text-muted-foreground">Check the current portal instructions for this step and keep the relevant acknowledgement or supporting evidence with your application records.</p></div></li>)}</ol>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">Processing time, fees and status tracking</h2>
            <p className="leading-relaxed text-muted-foreground">Processing time and cost should be confirmed for the particular application before you make a commitment. The timeline can depend on the issuing authority, application category, document completeness, payment confirmation, verification, inspection, test results and the volume of applications being handled. If the authority requests corrections or further information, the total time may increase. A third-party service provider cannot guarantee a government decision or override an official queue. Be cautious of claims that approval is certain or that every applicant will receive a certificate within a fixed number of hours or days.</p>
            <p className="leading-relaxed text-muted-foreground">Ask for a clear breakdown of professional assistance charges and statutory or third-party costs where these are relevant. Check whether a quote includes application preparation, document review, portal filing, responses to routine clarifications, testing, inspection charges, courier expenses or future renewal work. Not every service includes all these activities, and some charges are payable directly to an authority or independent organisation. Once an application is submitted, use the official reference number to track progress and retain payment receipts. If the status appears unchanged, follow the official escalation or contact procedure rather than relying on an unofficial message or paying an unknown person to expedite it.</p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">Common mistakes to avoid</h2>
            <p className="leading-relaxed text-muted-foreground">Frequent application problems include selecting the wrong service category, using an outdated checklist, entering inconsistent business details, uploading unreadable files, omitting a required authorisation, misunderstanding the role of an agent or signatory, and failing to respond to an official clarification. Another common issue is assuming that a registration issued for one activity or premises automatically covers a different activity, location, product or legal entity. Always read the scope printed on the certificate and the conditions that accompany it. Where the application asks for a declaration, make sure the person submitting it understands what is being confirmed.</p>
            <p className="leading-relaxed text-muted-foreground">Avoid copying another applicant's form or using a generic document set without checking the facts. Do not provide false details, make unsupported claims about eligibility or use a certificate that belongs to another business. If you discover an error after submission, review the authority's correction process and seek guidance on whether an amendment, resubmission or formal explanation is required. Keep communication professional and factual. These steps cannot guarantee approval, but they can reduce avoidable errors and make it easier to respond if the authority needs more information.</p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">What to do after registration or approval</h2>
            <p className="leading-relaxed text-muted-foreground">After a certificate, code or approval is issued, verify that the details are accurate and that the document relates to the correct entity, activity and location. Save the official copy and any verification details in a place where the responsible people can retrieve them. Note any validity period, renewal window, reporting obligation, conditions or restrictions stated by the issuing body. If the business changes its name, address, ownership, activity, workforce or product range, check whether the authority must be notified or the registration updated. A certificate should not be treated as permission for activities that fall outside its stated scope.</p>
            <p className="leading-relaxed text-muted-foreground">Assign responsibility for future compliance rather than leaving the document with one employee or adviser. Keep reminders for relevant dates, maintain the records required by the scheme and make sure staff understand any conditions that affect day-to-day operations. If the business stops the activity or no longer needs the registration, confirm whether surrender, cancellation or an update is required. These ongoing actions vary considerably between services; use the official certificate and current guidance as the source of truth. Shubh Consultancy Services can help you identify questions to review, while formal interpretations and decisions remain with the relevant authority.</p>
          </section>


          <section className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">How Shubh Consultancy Services can support your preparation</h2>
            <p className="leading-relaxed text-muted-foreground">A structured consultation can help turn a broad question into a practical checklist. Start by sharing the exact service you are considering, your entity type, state or city, business activity and the stage your application has reached. If you have already started an application, explain which fields have been completed and whether the portal has displayed a validation message or clarification. This context helps identify the right questions to resolve before more time is spent collecting documents or submitting information.</p>
            <p className="leading-relaxed text-muted-foreground">Depending on the service and agreed scope, assistance may include an initial requirement discussion, a document checklist, review of the information you provide, help organising application details and guidance on tracking the submission. Confirm the scope, professional charges, exclusions and any third-party or government fees before work begins. You should retain access to your own email, phone number, portal account and application reference wherever the process permits. Never share a password or one-time passcode with an unverified person. A consultant can assist with preparation, but cannot promise that an authority will approve an application or waive statutory requirements.</p>
            <p className="leading-relaxed text-muted-foreground">For the most useful review, keep your documents current and explain any unusual circumstances upfront, such as a recent change of address, mismatch in entity records, a previous rejection, a pending correction or an application submitted under a different category. If the matter requires legal interpretation, a technical audit or a decision reserved for the authority, you may need advice from the appropriate qualified professional or direct confirmation from the issuing body. Our aim is to help you understand the process and prepare carefully, not to replace the official decision-making process.</p>
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
