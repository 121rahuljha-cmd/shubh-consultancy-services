import type { Metadata } from 'next'
import { ContentCreator } from '@/components/admin/content-creator'

export const metadata: Metadata = { title: 'Blogs', robots: { index: false, follow: false } }

export default function BlogsPage() {
  return <ContentCreator />
}
