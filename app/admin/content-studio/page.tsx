import type { Metadata } from 'next'
import { ContentCreator } from '@/components/admin/content-creator'

export const metadata: Metadata = { title: 'Content Studio', robots: { index: false, follow: false } }

export default function ContentStudioPage() {
  return <ContentCreator />
}
