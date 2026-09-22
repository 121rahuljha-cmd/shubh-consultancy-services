import type { Metadata } from 'next'
import Link from 'next/link'

import { ServiceInventoryDirectory } from '@/components/service-inventory-directory'
import { inventoryCategories, inventory } from '@/lib/service-inventory'

export const metadata: Metadata = {
  title: 'All Services',
  description:
    'Explore the unified Shubh Consultancy service inventory across business registration, tax, licensing, compliance and professional services.',
}

export default function ServicesIndexPage() {
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
              <li className="font-medium text-primary-foreground">Services</li>
            </ol>
          </nav>
          <h1 className="max-w-3xl text-balance font-serif text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
            Every registration, licence and filing your business needs
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-primary-foreground/75">
            {inventory.length} unified records across {inventoryCategories.length} categories. Planned services are clearly marked until original content is ready.
          </p>
        </div>
      </section>

      <ServiceInventoryDirectory />
    </>
  )
}
