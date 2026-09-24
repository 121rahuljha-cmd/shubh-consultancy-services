import type { Metadata } from 'next'

import { LegalDocument } from '@/components/legal-document'

export const metadata: Metadata = { title: 'Terms & Conditions', description: 'Terms and Conditions for Shubh Consultancy Services.', robots: { index: false, follow: true } }
export const dynamic = 'force-dynamic'

export default function TermsPage() {
  return <LegalDocument title="Terms & Conditions" />
}
