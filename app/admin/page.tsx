import { PageCms } from '@/components/admin/page-cms'
import { PageAiEditorStandalone } from '@/components/admin/page-ai-editor'

export const metadata = {
  title: 'Admin Pages',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <><PageAiEditorStandalone /><PageCms /></>
}
