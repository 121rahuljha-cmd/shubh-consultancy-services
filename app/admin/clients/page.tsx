import type { Metadata } from 'next'

import { ClientsManager } from '@/components/admin/clients-manager'

export const metadata: Metadata = { title: 'Clients', robots: { index: false, follow: false } }

export default function ClientsPage() {
  return <ClientsManager />
}
