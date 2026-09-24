import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { ServiceBuilderRecord } from "@/lib/service-builder";
import { PublicLinkingSections } from "@/components/public-linking-sections";
import type { PublicLinkSets } from "@/lib/public-linking";

const visible = <T extends { enabled: boolean }>(items: T[]) =>
  items.filter((item) => item.enabled);
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.filter(Boolean).map((item) => (
        <li
          key={item}
          className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
        >
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
          {item}
        </li>
      ))}
    </ul>
  );
}
export function ServiceBuilderRenderer({ record, linking }: { record: ServiceBuilderRecord; linking?: PublicLinkSets }) {
  const faqs = record.faqs.filter(
    (faq) => faq.enabled && faq.question && faq.answer,
  );
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: record.serviceName,
      description: record.shortDescription,
      url: record.seo.canonicalUrl || `/services/${record.slug}`,
      provider: { "@type": "Organization", name: "Shubh Consultancy Services" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "/" },
        {
          "@type": "ListItem",
          position: 2,
          name: record.serviceName,
          item: record.seo.canonicalUrl || `/services/${record.slug}`,
        },
      ],
    },
    ...(faqs.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
        ]
      : []),
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-primary">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="mb-6 text-sm text-primary-foreground/60"
            >
              Home / {record.serviceName}
            </nav>
            <p className="eyebrow text-accent">
              {record.quickInfo.serviceType}
            </p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              {record.hero.h1 || record.serviceName}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/75">
              {record.hero.description || record.shortDescription}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={<a href={record.hero.primaryCtaUrl} />}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {record.hero.primaryCtaText}
              </Button>
              {record.hero.secondaryCtaText && (
                <Button
                  nativeButton={false}
                  render={<a href={record.hero.secondaryCtaUrl} />}
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  {record.hero.secondaryCtaText}
                </Button>
              )}
            </div>
          </div>
          {record.hero.image.image && (
            <img
              src={record.hero.image.image}
              alt={record.hero.image.altText}
              title={record.hero.image.title}
              className="h-auto w-full rounded-xl object-cover"
            />
          )}
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(record.quickInfo.enabled)
            .filter(([, enabled]) => enabled)
            .map(([key]) => {
              const value =
                record.quickInfo[key as keyof typeof record.quickInfo];
              return typeof value === "string" && value ? (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {key.replace(/[A-Z]/g, (letter) => ` ${letter}`)}
                  </p>
                  <p className="mt-2 font-serif text-lg font-bold text-primary">
                    {value}
                  </p>
                </div>
              ) : null;
            })}
        </section>
        {record.about.description && (
          <section className="mt-14 max-w-3xl">
            <h2 className="font-serif text-3xl font-bold text-primary">
              {record.about.heading}
            </h2>
            <div className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {record.about.description}
            </div>
          </section>
        )}
        {visible(record.boxes).length > 0 && (
          <section className="mt-14 grid gap-5 md:grid-cols-2">
            {visible(record.boxes).map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-6"
              >
                <h2 className="font-serif text-xl font-bold text-primary">
                  {item.title}
                </h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                {item.link && (
                  <Link
                    className="mt-4 inline-block font-semibold text-accent"
                    href={item.link}
                  >
                    Learn more
                  </Link>
                )}
              </article>
            ))}
          </section>
        )}
        {visible(record.benefits).length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-3xl font-bold text-primary">
              Benefits
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {visible(record.benefits).map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <h3 className="font-serif text-lg font-bold text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
        {visible(record.process).length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-3xl font-bold text-primary">
              How the process works
            </h2>
            <ol className="mt-6 flex flex-col gap-5">
              {visible(record.process).map((item, index) => (
                <li key={item.id} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
        {visible(record.documents).length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-3xl font-bold text-primary">
              Documents required
            </h2>
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <BulletList
                items={visible(record.documents).map(
                  (item) =>
                    `${item.title}${item.required === "optional" ? " (optional)" : ""}${item.description ? ` — ${item.description}` : ""}`,
                )}
              />
            </div>
          </section>
        )}
        {visible(record.pricing).length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-3xl font-bold text-primary">
              Pricing
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {visible(record.pricing).map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h3 className="font-serif text-xl font-bold text-primary">
                    {plan.planName}
                  </h3>
                  <p className="mt-3 font-serif text-2xl font-bold text-accent">
                    {plan.price || "Contact Us"} {plan.price && plan.currency}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {plan.description}
                  </p>
                  {plan.cta && (
                    <a
                      className="mt-5 inline-block font-semibold text-accent"
                      href={plan.cta}
                    >
                      {plan.cta}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
        {record.whyChooseUs.description && (
          <section className="mt-14 rounded-xl bg-surface p-7">
            <h2 className="font-serif text-3xl font-bold text-primary">
              {record.whyChooseUs.heading}
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              {record.whyChooseUs.description}
            </p>
            {visible(record.whyChooseUs.points).length > 0 && (
              <div className="mt-5">
                <BulletList
                  items={visible(record.whyChooseUs.points).map(
                    (item) => `${item.title} — ${item.description}`,
                  )}
                />
              </div>
            )}
          </section>
        )}
        {faqs.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-3xl font-bold text-primary">
              Frequently asked questions
            </h2>
            <Accordion className="mt-5 rounded-xl border border-border bg-card px-5">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
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
        )}
        {record.cta.heading && (
          <section className="mt-14 rounded-xl bg-primary p-8 text-center">
            <h2 className="font-serif text-3xl font-bold text-primary-foreground">
              {record.cta.heading}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/75">
              {record.cta.description}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                nativeButton={false}
                render={<a href={record.cta.buttonUrl} />}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {record.cta.buttonText}
              </Button>
              <a
                href={record.cta.whatsappUrl}
                className="inline-flex items-center rounded-lg border border-primary-foreground/25 px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                WhatsApp
              </a>
            </div>
          </section>
        )}
      </main>
      {linking && <PublicLinkingSections sets={linking} />}
    </>
  );
}
