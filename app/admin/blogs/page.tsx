import type { Metadata } from 'next'
import { BlogManager } from '@/components/admin/blog-manager'

export const metadata: Metadata = { title: 'Blog Management', robots: { index: false, follow: false } }

export default function BlogsPage() {
  return <BlogManager />
}
