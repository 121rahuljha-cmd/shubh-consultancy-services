import type { Metadata } from 'next'
import { ContentCreator } from '@/components/admin/content-creator'

export const metadata: Metadata = { title: 'Blog Creator', robots: { index: false, follow: false } }
export default function BlogCreatorPage() { return <ContentCreator /> }
