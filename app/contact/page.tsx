import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { contact } from '@/lib/site-data'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Talk to Shubh Consultancy Services. Call ${contact.phonePrimary} or visit our office in Shalimar Garden Extension, Ghaziabad.`,
}

export default function ContactPage() {
  return (
    <>
      <section className="bg-primary">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-14 md:py-18">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <li>
                <Link href="/" className="hover:text-primary-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-primary-foreground">Contact</li>
            </ol>
          </nav>
          <h1 className="max-w-3xl text-balance font-serif text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
            Talk to a compliance expert today
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/75">
            Call or message us and we will tell you exactly what your business
            needs, what it costs and how long it takes.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_1fr]">
        {/* Quick contact */}
        <section className="flex flex-col gap-6">
          <h2 className="font-serif text-2xl font-bold text-primary">
            Reach us directly
          </h2>

          <div className="flex flex-col gap-4">
            <a
              href={contact.phonePrimaryHref}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/50"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Phone className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Primary line
                </span>
                <span className="font-serif text-lg font-semibold text-primary group-hover:text-accent">
                  {contact.phonePrimary}
                </span>
              </span>
            </a>

            <a
              href={contact.phoneSecondaryHref}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/50"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Phone className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Alternate line
                </span>
                <span className="font-serif text-lg font-semibold text-primary group-hover:text-accent">
                  {contact.phoneSecondary}
                </span>
              </span>
            </a>

            <a
              href={contact.emailHref}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/50"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Mail className="size-5" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </span>
                <span className="break-all font-serif text-lg font-semibold text-primary group-hover:text-accent">
                  {contact.email}
                </span>
              </span>
            </a>
          </div>

          <Button
            nativeButton={false}
            render={
              <a href={contact.whatsappHref} target="_blank" rel="noreferrer" />
            }
            size="lg"
            className="w-fit bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Start a WhatsApp chat
          </Button>
        </section>

        <ContactForm />

        {/* Office details */}
        <section className="flex flex-col gap-6">
          <h2 className="font-serif text-2xl font-bold text-primary">
            Visit our office
          </h2>

          <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-base font-semibold text-primary">
                  Office address
                </h3>
                <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                  {contact.address}
                </address>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-border pt-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-base font-semibold text-primary">
                  Working hours
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {contact.hours}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sunday — closed
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              title="Shubh Consultancy Services office location on Google Maps"
              src="https://www.google.com/maps?q=Shalimar+Garden+Extension+1,+Ghaziabad,+Uttar+Pradesh+201005&output=embed"
              width="100%"
              height="300"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block border-0"
            />
          </div>
        </section>
      </div>
    </>
  )
}
