import type { Metadata } from 'next'
import { SeoCommandCenter } from '@/components/admin/seo-command-center'

export const metadata: Metadata = { title: 'SEO Command Center', robots: { index: false, follow: false } }

export default function SeoCommandCenterPage() { return <SeoCommandCenter /> }
