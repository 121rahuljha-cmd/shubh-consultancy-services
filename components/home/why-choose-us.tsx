import {
  BadgeCheck,
  Clock,
  HeadphonesIcon,
  IndianRupee,
  ShieldCheck,
  Users,
} from 'lucide-react'

const reasons = [
  {
    icon: Users,
    title: 'Qualified in-house experts',
    description:
      'Chartered Accountants, Company Secretaries and legal professionals handle your file directly — not an untrained call centre.',
  },
  {
    icon: IndianRupee,
    title: 'Transparent pricing',
    description:
      'Government fees and professional fees are quoted separately in writing before we begin. Nothing is added midway.',
  },
  {
    icon: Clock,
    title: 'Deadlines tracked for you',
    description:
      'We monitor your GST, ITR and ROC due dates and remind you in advance so you never pay a late fee.',
  },
  {
    icon: HeadphonesIcon,
    title: 'One dedicated contact',
    description:
      'A single relationship manager owns your case from start to finish. You never re-explain your situation.',
  },
  {
    icon: ShieldCheck,
    title: 'Documents kept confidential',
    description:
      'Your financial records and identity documents are handled under strict confidentiality and never shared.',
  },
  {
    icon: BadgeCheck,
    title: 'Complete compliance cover',
    description:
      'Registration, licensing, tax filing, trademark and IT services under one roof — no juggling multiple vendors.',
  },
]

export function WhyChooseUs() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-4">
        <div className="flex flex-col gap-3 lg:max-w-2xl">
          <span className="inline-flex w-fit items-center rounded-full bg-brand/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Why Shubh Consultancy
          </span>
          <h2 className="max-w-2xl font-heading text-3xl font-extrabold leading-[1.1] text-balance text-navy sm:text-4xl">
            Compliance handled properly, the first time
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Businesses across Delhi NCR rely on us because we treat filings as
            legal work that has to be correct, not paperwork to rush through.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason) => {
            const Icon = reason.icon
            return (
              <li
                key={reason.title}
                className="flex flex-col gap-4 rounded-lg border border-border bg-background px-6 py-7 transition-all hover:border-brand hover:shadow-lg hover:shadow-navy/5"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-tint text-brand">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-heading text-base font-bold text-navy">
                  {reason.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {reason.description}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
