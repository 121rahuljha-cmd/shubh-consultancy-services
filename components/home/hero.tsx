import Image from 'next/image'
import { BadgeCheck, Phone, Clock3, ShieldCheck } from 'lucide-react'
import { contact } from '@/lib/site-data'
import { ServiceSearch } from '@/components/service-search'

const assurances = [
  { icon: BadgeCheck, label: 'Filed by qualified professionals' },
  { icon: Clock3, label: 'Transparent timelines, no surprises' },
  { icon: ShieldCheck, label: 'Single point of contact throughout' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-deep">
      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="container-page relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-20">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand">
            Trusted since 2015 &middot; Ghaziabad
          </span>

          <h1 className="max-w-2xl font-heading text-4xl font-extrabold leading-[1.08] text-balance text-white sm:text-5xl lg:text-[3.4rem]">
            Licensing, tax and compliance{' '}
            <span className="text-brand">handled properly</span> — so you can get
            back to the business.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-white/70">
            From FSSAI licences and GST registration to company incorporation,
            trademarks, ROC filings and digital marketing — Shubh Consultancy
            Services runs the paperwork end to end for over 2,500 businesses
            across India.
          </p>

          <ServiceSearch />

          <ul className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {assurances.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-white/75"
              >
                <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Illustration + hotline card */}
        <div className="relative w-full">
          <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
            <Image
              src="/hero-consulting.png"
              alt="Consultants reviewing a certified compliance document with financial reports"
              width={1024}
              height={1024}
              priority
              className="h-auto w-full"
            />
          </div>

          <a
            href={contact.phonePrimaryHref}
            className="group absolute -bottom-5 left-4 right-4 flex items-center gap-3.5 rounded-xl bg-white p-4 shadow-2xl transition-transform hover:-translate-y-0.5 sm:left-6 sm:right-auto sm:max-w-xs"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <Phone className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Hotline &mdash; talk to an expert
              </span>
              <span className="font-heading text-lg font-extrabold text-navy group-hover:text-brand">
                {contact.phonePrimary}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
