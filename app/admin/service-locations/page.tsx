import type { Metadata } from 'next'
import { ServiceLocationGenerator } from '@/components/admin/service-location-generator'

export const metadata: Metadata = { title: 'Service Location Pages', robots: { index: false, follow: false } }
export default function ServiceLocationsPage() { return <ServiceLocationGenerator /> }
