import type { Metadata } from 'next'
import { SectionBuilder } from '@/components/admin/section-builder'

export const metadata: Metadata = { title: 'Section Builder', robots: { index: false, follow: false } }
export default function SectionsPage() { return <SectionBuilder /> }
