import type { Metadata } from 'next'

import { LegalDocument } from '@/components/legal-document'

export const metadata: Metadata = { title: 'Refund Policy', description: 'Refund Policy for Shubh Consultancy Services.', robots: { index: false, follow: true } }
export const dynamic = 'force-dynamic'

export default function RefundPolicyPage() {
  return <LegalDocument title="Refund Policy" />
}
