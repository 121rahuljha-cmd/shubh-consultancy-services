import type { Metadata } from 'next'
import { PublicLinkingManager } from '@/components/admin/public-linking-manager'

export const metadata: Metadata = { title: 'Public Linking', robots: { index: false, follow: false } }
export default function LinkingPage() { return <PublicLinkingManager /> }
