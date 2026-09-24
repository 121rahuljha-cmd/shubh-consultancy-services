import Link from 'next/link'

import { CustomerReviews } from '@/components/customer-reviews'
import type { PublicLink, PublicLinkSets } from '@/lib/public-linking'

function LinkGroup({ title, items }: { title: string; items: PublicLink[] }) {
  return (
    <section className="border-t border-border py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Internal links</p>
          <h2 className="font-serif text-2xl font-bold text-navy">{title}</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {items.length} link{items.length === 1 ? '' : 's'}
        </span>
      </div>

      {items.length ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.url}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand"
              >
                <span className="font-semibold text-navy">{item.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.pageType}
                  {item.service ? ` · ${item.service}` : ''}
                  {item.state ? ` · ${item.state}` : ''}
                  {item.city ? ` · ${item.city}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No published links configured yet.</p>
      )}
    </section>
  )
}

export function PublicLinkingSections({ sets }: { sets: PublicLinkSets }) {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      <LinkGroup title="Related Services" items={sets.relatedServices} />
      <CustomerReviews />
      <LinkGroup title="Popular Searches" items={sets.popularSearches} />
    </div>
  )
}
