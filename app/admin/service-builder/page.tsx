import type { Metadata } from 'next'
import Link from 'next/link'
import { ServiceBuilderManager } from '@/components/admin/service-builder-manager'

export const metadata: Metadata = {
  title: 'Service Builder',
  robots: { index: false, follow: false },
}

export default function ServiceBuilderPage() {
  return (
    <>
      <section
        aria-label="Content tools"
        className="border-b border-border bg-brand-tint px-4 py-4 md:px-6"
      >
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">
              Content workspace
            </p>
            <h2 className="mt-1 text-lg font-bold text-navy">
              AI Content Studio
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Create service-page drafts, SEO suggestions, FAQs, process steps,
              document lists and local-content ideas. Review every suggestion
              before saving or publishing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/service-builder/ai?service=fssai-food-licence"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Open AI Content Studio
            </Link>
            <Link
              href="/admin/service-locations?service=fssai-food-licence"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-bold text-navy hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              FSSAI Location Pages
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-[1500px] text-xs text-muted-foreground">
          AI provider availability is shown inside the studio. Generated content
          remains a proposal; it is never published automatically.
        </p>
      </section>
      <ServiceBuilderManager />
    </>
  )
}
