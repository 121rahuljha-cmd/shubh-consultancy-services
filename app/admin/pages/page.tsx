import type { Metadata } from 'next'
import { PageCms } from '@/components/admin/page-cms'
import { PageAiEditorStandalone } from '@/components/admin/page-ai-editor'

export const metadata: Metadata = { title: 'Pages', robots: { index: false, follow: false } }

export default function PagesPage() {
  return <><PageAiEditorStandalone /><PageCms /></>
}
