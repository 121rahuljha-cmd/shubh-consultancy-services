import type { Metadata } from 'next'
import { PageGeneratorAssistant } from '@/components/admin/page-generator-assistant'

export const metadata: Metadata = {
  title: 'Page Generator',
  robots: { index: false, follow: false },
}

export default function PageGeneratorPage() {
  return <PageGeneratorAssistant />
}
