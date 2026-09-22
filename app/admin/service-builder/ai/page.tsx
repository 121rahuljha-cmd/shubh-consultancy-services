'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AiAssistant } from '@/components/admin/ai-assistant'
import { SeoResearchPanel } from '@/components/admin/seo-research-panel'
import { getBuilderRecords, saveBuilderRecords, type ServiceBuilderRecord } from '@/lib/service-builder'
import { cmsPageFromAi } from '@/lib/ai/cms-integration'
import { getPages, saveCmsRevision, savePages } from '@/lib/page-cms'
import { saveSections } from '@/lib/cms-sections'
import type { AiSuggestion } from '@/lib/ai/provider'

export default function ServiceBuilderAiPage() {
  const [record, setRecord] = useState<ServiceBuilderRecord | null>(null)
  useEffect(() => { const records = getBuilderRecords(); const slug = new URLSearchParams(window.location.search).get('service') || 'fssai-food-licence'; setRecord(records.find((item) => item.serviceSlug === slug) || records[0] || null) }, [])
  if (!record) return <main className="p-8">Loading AI assistant…</main>
  const createCmsDraft = (suggestion: AiSuggestion) => { const result = cmsPageFromAi(record, suggestion); savePages([...getPages(), result.page]); saveSections(result.page.id, result.sections); saveCmsRevision(result.page, result.sections, 'ai-generated'); window.location.href = `/admin/sections?page=${encodeURIComponent(result.page.id)}` }
  return <main className="min-h-screen bg-surface"><div className="mx-auto max-w-6xl px-4 py-10 md:px-6"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Admin / AI assistance</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">{record.serviceName}</h1><p className="mt-2 text-sm text-muted-foreground">Generate temporary content, then load a reviewed full-page draft into the existing CMS Section Builder.</p></div><div className="flex gap-2"><Link href={`/admin/service-builder/edit?service=${record.serviceSlug}`} className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">Back to builder</Link><Link href="/admin/service-builder" className="rounded-md border border-brand px-4 py-2.5 text-sm font-bold text-brand">All services</Link></div></div><AiAssistant record={record} onAccept={(changes) => { const next = { ...record, ...changes, updatedAt: new Date().toISOString() }; setRecord(next); const records = getBuilderRecords().map((item) => item.id === next.id ? next : item); saveBuilderRecords(records) }} onCreateCmsDraft={createCmsDraft} /><SeoResearchPanel record={record} /></div></main>
}
