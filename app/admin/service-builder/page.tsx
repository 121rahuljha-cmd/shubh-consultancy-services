import type { Metadata } from 'next'
import Link from 'next/link'
import { ServiceBuilderManager } from '@/components/admin/service-builder-manager'

export const metadata: Metadata = { title: 'Service Builder', robots: { index: false, follow: false } }
export default function ServiceBuilderPage() { return <><div className="border-b border-border bg-brand-tint px-4 py-3 text-center text-sm text-navy"><Link href="/admin/service-builder/ai?service=fssai-food-licence" className="font-bold text-brand hover:underline">Open the AI assistant in mock mode</Link><span className="mx-2 text-muted-foreground">Suggestions require review and are never published automatically.</span><Link href="/admin/service-locations?service=fssai-food-licence" className="font-bold text-brand hover:underline">Open FSSAI Location Pages</Link></div><ServiceBuilderManager /></> }
