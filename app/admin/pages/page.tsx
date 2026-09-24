import type { Metadata } from 'next'
import { PageCms } from '@/components/admin/page-cms'
import { PageAiEditorStandalone } from '@/components/admin/page-ai-editor'
import { PublicPageInventory } from '@/components/admin/page-cms'
import { discoverPublicPages } from '@/lib/public-page-registry'

export const metadata: Metadata = { title: 'Pages', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function PagesPage() {
  return <><PublicPageInventory pages={await discoverPublicPages()} /><PageAiEditorStandalone /><PageCms /></>
}
