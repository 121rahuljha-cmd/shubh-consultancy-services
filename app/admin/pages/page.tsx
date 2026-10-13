import type { Metadata } from 'next'
import { PageCms } from '@/components/admin/page-cms'
import { ManagedPageDirectory } from '@/components/admin/managed-page-directory'
import { discoverPublicPages } from '@/lib/public-page-registry'

export const metadata: Metadata = { title: 'Pages', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function PagesPage() {
  const publicPages = await discoverPublicPages()
  return <><ManagedPageDirectory publicPages={publicPages} /><PageCms hideDirectory /></>
}
