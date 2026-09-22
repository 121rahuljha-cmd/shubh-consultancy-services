import { Quote, Star } from 'lucide-react'

import { testimonials } from '@/lib/site-data'

export function Testimonials() {
  return (
    <section className="bg-secondary py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center rounded-full bg-brand/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Client feedback
          </span>
          <h2 className="max-w-2xl font-heading text-3xl font-extrabold leading-[1.1] text-balance text-navy sm:text-4xl">
            Trusted by founders and business owners
          </h2>
          <div className="flex items-center gap-2.5">
            <span className="flex gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-brand text-brand"
                  strokeWidth={0}
                />
              ))}
            </span>
            <p className="text-sm font-medium text-muted-foreground">
              Rated 4.6 out of 5 by our clients
            </p>
          </div>
        </div>

        <ul className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <li
              key={testimonial.name}
              className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 transition-all hover:border-brand hover:shadow-lg hover:shadow-navy/5"
            >
              <Quote className="size-6 text-brand/30" aria-hidden="true" />
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground">
                {testimonial.quote}
              </blockquote>
              <footer className="flex flex-col gap-1 border-t border-border pt-5">
                <cite className="font-heading text-sm font-semibold not-italic text-navy">
                  {testimonial.name}
                </cite>
                <span className="text-xs text-muted-foreground">
                  {testimonial.role}
                </span>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
