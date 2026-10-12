import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'AI Service Builder', robots: { index: false, follow: false } }

// Keep old bookmarks working while the Service Builder AI becomes the canonical editor.
export default function ContentStudioPage() {
  redirect('/admin/service-builder/ai')
}
