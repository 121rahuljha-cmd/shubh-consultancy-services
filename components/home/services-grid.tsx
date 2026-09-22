'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Calculator,
  ClipboardCheck,
  Copyright,
  FileCheck,
  Globe,
  Receipt,
} from 'lucide-react'
import { contact } from '@/lib/site-data'
import { getPublicServiceGroups, HOMEPAGE_SERVICE_LIMIT, type PublicServiceGroup } from '@/lib/public-services'
import { categorySlug } from '@/lib/service-inventory'

const categoryIcons: Record<string, typeof Building2> = {
  Startup: Building2,
  Registrations: FileCheck,
  Trademark: Copyright,
  GST: Receipt,
  'Income Tax': Calculator,
  Compliance: ClipboardCheck,
  'IT Services': Globe,
}

export function ServicesGrid() {
  const [groups, setGroups] = useState<PublicServiceGroup[]>(() => getPublicServiceGroups())
  useEffect(() => {
    const refresh = () => setGroups(getPublicServiceGroups())
    window.addEventListener('scs-service-builder-updated', refresh)
    return () => window.removeEventListener('scs-service-builder-updated', refresh)
  }, [])

  return (
    <section id="services" className="bg-surface py-16 lg:py-24">
      <div className="container-page flex flex-col gap-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">Our Services</span>
            <h2 className="max-w-3xl font-heading text-3xl font-extrabold leading-tight text-balance text-navy sm:text-4xl">
              Everything a growing Indian business has to file, in one place
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Seven practice areas, one team. Pick the service you need and see
              exactly what it costs, what documents are required and how long it
              takes.
            </p>
          </div>

          <a
            href={contact.phonePrimaryHref}
            className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-navy px-5 py-3 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white lg:self-center"
          >
            Not sure what you need?
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const Icon = categoryIcons[group.label] ?? Building2
            const visibleItems = group.items.slice(0, HOMEPAGE_SERVICE_LIMIT)
            return (
                <article
                  key={group.label}
                  className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 transition-all hover:border-brand hover:shadow-lg hover:shadow-navy/5"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>

                <div className="flex flex-col gap-1.5">
                  <h3 className="font-heading text-base font-bold text-navy">
                    {group.label}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {group.blurb}
                  </p>
                </div>

                <ul className="flex flex-col gap-1.5 border-t border-border pt-5">
                  {visibleItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex items-center gap-2 text-sm font-medium text-navy-soft transition-colors hover:text-brand"
                      >
                        <ArrowRight
                          className="size-3.5 shrink-0 text-brand"
                          aria-hidden="true"
                        />
                        <span className="group-hover:underline">
                          {item.navLabel}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {group.items.length > HOMEPAGE_SERVICE_LIMIT && (
                  <Link href={`/services/category/${categorySlug(group.label)}`} className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline">
                    View More Services
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
