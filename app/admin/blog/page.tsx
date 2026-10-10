import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Blog Management', robots: { index: false, follow: false } }

export default function BlogPage() {
  redirect('/admin/blogs')
}
