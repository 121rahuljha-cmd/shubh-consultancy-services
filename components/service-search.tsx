'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import { services } from '@/lib/site-data'

const popular = [
  { label: 'FSSAI Licence', href: '/services/fssai-food-licence' },
  { label: 'GST Registration', href: '/services/gst-registration' },
  { label: 'ITR Filing', href: '/services/income-tax-return-filing' },
  { label: 'Trademark', href: '/services/trademark-registration' },
  {
    label: 'Pvt Ltd Company',
    href: '/services/private-limited-company-registration',
  },
]

export function ServiceSearch() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return services
      .filter((s) =>
        `${s.name} ${s.navLabel} ${s.category} ${s.summary}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6)
  }, [query])

  const showResults = focused && query.trim().length > 0

  return (
    <div className="w-full">
      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-xl shadow-navy-deep/20">
          <div className="flex flex-1 items-center gap-2.5 pl-2.5">
            <Search className="size-5 shrink-0 text-brand" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current)
                setFocused(true)
              }}
              onBlur={() => {
                blurTimer.current = setTimeout(() => setFocused(false), 150)
              }}
              placeholder="Search a service — FSSAI, GST, trademark…"
              aria-label="Search our services"
              className="h-11 w-full min-w-0 bg-transparent text-sm text-navy outline-hidden placeholder:text-muted-foreground"
            />
          </div>
          <Link
            href="#services"
            className="shrink-0 rounded-md bg-brand px-4 py-3 text-[13px] font-bold text-white transition-colors hover:bg-brand-hover sm:px-6"
          >
            <span className="hidden sm:inline">Explore Services</span>
            <span className="sm:hidden">Browse</span>
          </Link>
        </div>

        {showResults && (
          <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-border bg-white shadow-2xl">
            {results.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto py-1.5">
                {results.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-brand-tint"
                    >
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-navy">
                          {s.navLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.category} &middot; from {s.startingAt}
                        </span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-brand opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-5 text-sm text-muted-foreground">
                {'No service matches "'}
                {query.trim()}
                {'". Call us and we\u2019ll point you to the right one.'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Popular
        </span>
        {popular.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
          >
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
