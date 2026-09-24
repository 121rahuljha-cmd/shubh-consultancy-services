import type { Metadata } from 'next'

import { LegalDocument } from '@/components/legal-document'

export const metadata: Metadata = { title: 'Privacy Policy', description: 'Privacy Policy for Shubh Consultancy Services.', robots: { index: false, follow: true } }
export const dynamic = 'force-dynamic'

export default function PrivacyPolicyPage() {
  return <LegalDocument title="Privacy Policy" />
}
