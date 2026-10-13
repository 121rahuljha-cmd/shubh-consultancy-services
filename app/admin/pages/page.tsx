import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageCms } from '@/components/admin/page-cms'
import { ManagedPageDirectory } from '@/components/admin/managed-page-directory'
import { discoverPublicPages } from '@/lib/public-page-registry'

export const metadata: Metadata = { title: 'Pages', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function PagesPage() {
  const publicPages = await discoverPublicPages()
  return <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
    <ManagedPageDirectory publicPages={publicPages} />
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading page editor…</p>}><PageCms /></Suspense>
  </div>
}
