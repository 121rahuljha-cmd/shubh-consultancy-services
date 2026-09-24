import Link from 'next/link'

import type { ClientRecord } from '@/lib/clients'

export function ClientPortfolio({ clients, showViewMore = true }: { clients: ClientRecord[]; showViewMore?: boolean }) {
  return (
    <section className="bg-background py-16 md:py-20" aria-labelledby="client-portfolio-title">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Our Clients</p><h2 id="client-portfolio-title" className="mt-2 font-heading text-3xl font-extrabold text-navy sm:text-4xl">Businesses we support</h2></div>
          {showViewMore ? <Link href="/clients" className="rounded-md border border-brand px-4 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white">View More Clients</Link> : null}
        </div>
        {clients.length ? <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{clients.map((client) => <li key={client.id} className="flex min-h-40 flex-col gap-3 rounded-lg border border-border bg-card p-5"><img src={client.logo} alt={client.logoAlt} className="h-14 w-full object-contain object-left" /><h3 className="font-heading text-lg font-bold text-navy">{client.name}</h3>{client.description ? <p className="text-sm leading-relaxed text-muted-foreground">{client.description}</p> : null}{client.websiteUrl ? <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-auto text-sm font-bold text-brand hover:underline">Visit Website &rarr;</a> : null}</li>)}</ul> : <p className="mt-8 rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Our client portfolio will be updated soon.</p>}
      </div>
    </section>
  )
}
