import type { Metadata } from 'next'
import { ServiceBuilder } from '@/components/admin/service-builder'

export const metadata: Metadata = { title: 'Edit Service Builder', robots: { index: false, follow: false } }
export default function EditServiceBuilderPage() { return <ServiceBuilder /> }
