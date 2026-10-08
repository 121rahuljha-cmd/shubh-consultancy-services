import type { Metadata } from 'next'
import { PublicRouteOverridesManager } from '@/components/admin/public-route-overrides-manager'

export const metadata: Metadata = { title: 'Public Route Overrides', robots: { index: false, follow: false } }

export default function PublicRoutesPage() {
  return <PublicRouteOverridesManager />
}
