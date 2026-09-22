import { MessageCircle, Phone } from 'lucide-react'
import { contact } from '@/lib/site-data'

export function CtaBand() {
  return (
    <section className="bg-primary py-16 md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4">
          <h2 className="max-w-2xl font-heading text-3xl font-extrabold leading-[1.1] text-balance text-white sm:text-4xl">
            Not sure which registration applies to you?
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-white/80">
            Talk to a qualified expert. We will tell you exactly what your
            business needs, what it costs, and how long it takes — before you
            commit to anything.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={contact.phonePrimaryHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
          >
            <Phone className="size-3.5" aria-hidden="true" />
            Call {contact.phonePrimary}
          </a>
          <a
            href={contact.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-white/20 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" />
            Chat on WhatsApp
          </a>
        </div>

        <p className="text-xs text-white/60">
          {contact.hours} · {contact.email}
        </p>
      </div>
    </section>
  )
}
