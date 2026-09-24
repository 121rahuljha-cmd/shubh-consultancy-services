import type { Metadata } from 'next'

import { ClientPortfolio } from '@/components/client-portfolio'
import { listEnabledClients } from '@/lib/clients'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const clients = await listEnabledClients()
  return {
    title: 'Our Clients',
    description: 'Verified client portfolio of Shubh Consultancy Services.',
    robots: { index: clients.length > 0, follow: true },
  }
}

export default async function ClientsPage() {
  const clients = await listEnabledClients()
  return <main><div className="container-page py-14 md:py-20"><p className="eyebrow">Client portfolio</p><h1 className="mt-2 font-heading text-4xl font-extrabold text-navy">Our Clients</h1><p className="mt-3 max-w-2xl text-muted-foreground">Businesses supported by Shubh Consultancy Services.</p></div><ClientPortfolio clients={clients} showViewMore={false} /></main>
}
