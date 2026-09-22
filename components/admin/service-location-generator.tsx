'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createBuilderRecord, getBuilderRecords, saveBuilderRecords } from '@/lib/service-builder'
import { getAiProviderStatusFromServer, generateWithServerAi, type AiProviderStatus } from '@/lib/ai/provider'
import { contextFromRecord } from '@/lib/ai/prompts'
import { mockAiProvider } from '@/lib/ai/mock-provider'
import { getPages, saveCmsRevision, type CmsPage } from '@/lib/page-cms'
import { saveSections } from '@/lib/cms-sections'
import { evaluateLocationSeoRisk, getLocationPages, locationPageStats, planLocationPages, saveLocationPage } from '@/lib/location-pages'
import { applyLocationAiDraft } from '@/lib/location-page-generation'
import { getState, states, top100Cities } from '@/lib/locations'

const input = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand'
const pageSize = 20
const label = (value: string) => value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())

export function ServiceLocationGenerator() {
  const params = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search)
  const serviceSlug = params?.get('service') || 'trademark-registration'
  const storedService = getBuilderRecords().find((record) => record.serviceSlug === serviceSlug)
  const service = storedService || createBuilderRecord(serviceSlug)
  const serviceName = service.serviceName || serviceSlug
  const [enabled, setEnabled] = useState(Boolean(service.locationGenerationEnabled))
  const [pages, setPages] = useState<CmsPage[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | 'service_state' | 'service_city'>('all')
  const [stateId, setStateId] = useState('')
  const [cityId, setCityId] = useState('')
  const [status, setStatus] = useState<'all' | CmsPage['status']>('all')
  const [generationStatus, setGenerationStatus] = useState<'all' | CmsPage['generationStatus']>('all')
  const [seoStatus, setSeoStatus] = useState<'all' | CmsPage['seoStatus']>('all')
  const [pageNumber, setPageNumber] = useState(1)
  const [notice, setNotice] = useState('')
  const [provider, setProvider] = useState<AiProviderStatus | null>(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ done: 0, failed: 0, total: 0 })
  const cancelRequested = useRef(false)

  const refresh = () => setPages(getLocationPages(serviceSlug))
  useEffect(() => { refresh(); getAiProviderStatusFromServer().then(setProvider) }, [serviceSlug])
  const filtered = useMemo(() => getLocationPages(serviceSlug, { query, pageType: type, stateId, cityId, status, generationStatus, seoStatus }), [pages, serviceSlug, query, type, stateId, cityId, status, generationStatus, seoStatus])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const visible = filtered.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
  const stats = locationPageStats(pages)

  const persistEnabled = (next: boolean) => { setEnabled(next); const records = getBuilderRecords(); const matching = records.find((record) => record.serviceSlug === serviceSlug); const updated = matching ? records.map((record) => record.serviceSlug === serviceSlug ? { ...record, locationGenerationEnabled: next, updatedAt: new Date().toISOString() } : record) : [...records, { ...service, locationGenerationEnabled: next, updatedAt: new Date().toISOString() }]; saveBuilderRecords(updated) }
  const create = (scope: 'all' | 'state' | 'city') => { const result = planLocationPages(serviceSlug, serviceName, scope); refresh(); setNotice(`${result.added} new planned record(s) created. ${result.statePages} state/UT + ${result.cityPages} city records; total ${result.total}.`) }
  const resetPagination = () => setPageNumber(1)

  const generatePages = async (targets: CmsPage[]) => {
    const pending = targets.filter((page) => page.status === 'planned' || page.generationStatus === 'planned')
    if (!pending.length) { setNotice('No pending planned pages were selected. Generated pages are never regenerated automatically.'); return }
    cancelRequested.current = false; setGenerating(true); setProgress({ done: 0, failed: 0, total: pending.length })
    let failed = 0; let completed = 0
    for (const planned of pending) {
      if (cancelRequested.current) break
      try {
        const base = createBuilderRecord(serviceSlug)
        const context = { ...contextFromRecord(base), service: planned.title, pageType: planned.pageType, location: planned.targetLocation, state: getState(planned.stateId)?.name || planned.stateId, city: top100Cities.find((city) => city.id === planned.cityId)?.name || '', primaryKeyword: planned.primaryKeyword, existingContent: '', specialInstructions: 'Create useful local relevance, not a location-name substitution. Never invent local offices, reviews, officials, fees, processing times, authorities, or statistics. State what needs verification. Return a draft only.' }
        const suggestion = provider?.mode === 'real' ? await generateWithServerAi('complete-page', context) : await mockAiProvider.generate('complete-page', context)
        const result = applyLocationAiDraft(planned, base, suggestion)
        const risk = evaluateLocationSeoRisk(result.page, getPages())
        const reviewed = { ...result.page, locationSeoRisk: risk, status: 'review' as const, generationStatus: 'needs_review' as const, seoStatus: 'warning' as const, indexingStatus: 'NEEDS REVIEW — noindex and excluded from sitemap' }
        saveLocationPage(reviewed, serviceName); saveSections(planned.id, result.sections); saveCmsRevision(reviewed, result.sections, 'ai-generated')
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : 'Unknown AI generation error'
        const failedPage = { ...planned, generationError: message, updatedAt: new Date().toISOString() }
        saveLocationPage(failedPage, serviceName)
      }
      completed += 1; setProgress({ done: completed, failed, total: pending.length })
    }
    setGenerating(false); setSelected([]); refresh()
    setNotice(cancelRequested.current ? `Generation cancelled after ${completed} operation(s); ${failed} failed. Remaining planned pages can be resumed.` : `Generation complete: ${completed - failed} succeeded, ${failed} failed. Every generated page remains noindex and needs review.`)
  }

  const approve = (page: CmsPage) => { const next = { ...page, generationStatus: 'approved' as const, status: 'review' as const, indexingStatus: 'APPROVED — remains noindex until indexing is explicitly enabled', updatedAt: new Date().toISOString() }; saveLocationPage(next, serviceName); refresh(); setNotice(`${page.title} is approved but remains noindex.`) }
  const publish = (page: CmsPage) => { if (page.generationStatus !== 'approved') { setNotice('Approve this page before publishing it.'); return }; if (!window.confirm(`Publish ${page.title} as noindex? You can enable indexing only after a final SEO review.`)) return; const next = { ...page, status: 'published' as const, sitemap: { ...page.sitemap, include: false }, robotsIndex: false, indexingStatus: 'PUBLISHED — noindex pending explicit indexing decision', updatedAt: new Date().toISOString() }; saveLocationPage(next, serviceName); refresh(); setNotice(`${page.title} was published as noindex. It is not exposed through SEO link grids or sitemaps.`) }

  return <main className="min-h-screen bg-surface"><div className="mx-auto max-w-[1500px] px-4 py-10 md:px-8">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Admin / location pages</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">{serviceName}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Plan 36 State/UT and 100 ranked city pages. Planning is idempotent; generation is controlled, resumable, and never publishes or indexes a page.</p></div><div className="flex gap-2"><Link href={`/admin/service-builder/edit?service=${serviceSlug}`} className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">Edit service</Link><Link href="/admin/service-builder" className="rounded-md border border-brand px-4 py-2.5 text-sm font-bold text-brand">All services</Link></div></div>
    <section className="mb-6 rounded-xl border border-border bg-background p-5"><label className="flex items-center gap-3 text-sm font-bold text-navy"><input type="checkbox" checked={enabled} onChange={(event) => persistEnabled(event.target.checked)} /> Enable Location Page Generation</label>{enabled && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => create('all')} className="rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white">Create State + Top 100 City Pages</button><button type="button" onClick={() => create('state')} className="rounded-md border border-brand px-4 py-2.5 text-sm font-bold text-brand">Create 36 State Pages</button><button type="button" onClick={() => create('city')} className="rounded-md border border-brand px-4 py-2.5 text-sm font-bold text-brand">Create Top 100 City Pages</button></div>}<p className="mt-3 text-xs text-muted-foreground">Dataset: {states.length} official State/UT records reused from the project · {top100Cities.length} centrally ranked, editable city records. Enabling does not create records.</p></section>
    <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['Planned', stats.planned], ['AI generated', stats.generated], ['Needs review', stats.needsReview], ['Approved', stats.approved], ['Published', stats.published]].map(([title, value]) => <div key={String(title)} className="rounded-xl border border-border bg-background p-4"><p className="text-xs uppercase text-muted-foreground">{title}</p><p className="mt-1 font-serif text-2xl font-bold text-navy">{value}</p></div>)}</section>
    {notice && <p className="mb-5 rounded-lg bg-brand-tint p-3 text-sm font-semibold text-navy">{notice}</p>}
    <section className="rounded-xl border border-border bg-background p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><input className={input} aria-label="Search location" placeholder="Search location…" value={query} onChange={(event) => { setQuery(event.target.value); resetPagination() }} /><select className={input} aria-label="Filter state" value={stateId} onChange={(event) => { setStateId(event.target.value); setCityId(''); resetPagination() }}><option value="">All states/UTs</option>{states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}</select><select className={input} aria-label="Filter city" value={cityId} onChange={(event) => { setCityId(event.target.value); resetPagination() }}><option value="">All cities</option>{top100Cities.filter((city) => !stateId || city.stateId === stateId).map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select><select className={input} aria-label="Filter page type" value={type} onChange={(event) => { setType(event.target.value as typeof type); resetPagination() }}><option value="all">All page types</option><option value="service_state">State pages</option><option value="service_city">City pages</option></select><select className={input} aria-label="Filter page status" value={status} onChange={(event) => { setStatus(event.target.value as typeof status); resetPagination() }}><option value="all">All statuses</option>{(['planned', 'draft', 'review', 'published', 'archived'] as const).map((item) => <option key={item}>{item}</option>)}</select><select className={input} aria-label="Filter AI status" value={generationStatus} onChange={(event) => { setGenerationStatus(event.target.value as typeof generationStatus); resetPagination() }}><option value="all">All AI statuses</option>{(['planned', 'generated', 'needs_review', 'approved', 'published'] as const).map((item) => <option key={item}>{label(item)}</option>)}</select><select className={input} aria-label="Filter SEO status" value={seoStatus} onChange={(event) => { setSeoStatus(event.target.value as typeof seoStatus); resetPagination() }}><option value="all">All SEO statuses</option>{(['pending', 'warning', 'ready'] as const).map((item) => <option key={item}>{label(item)}</option>)}</select><button type="button" onClick={refresh} className="rounded-md border border-brand px-3 py-2 text-sm font-bold text-brand">Refresh</button></div>
      {pages.length > 0 && <div className="my-4 flex flex-wrap items-center gap-2"><button type="button" disabled={generating || !selected.length} onClick={() => generatePages(pages.filter((page) => selected.includes(page.id)))} className="rounded-md bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Generate Selected ({selected.length})</button><button type="button" disabled={generating || !pages.some((page) => page.status === 'planned')} onClick={() => { const pending = pages.filter((page) => page.status === 'planned'); if (window.confirm(`Generate all pending pages?\n\nTotal pending: ${pending.length}\nEstimated AI operations: ${pending.length}\n\nRequests run one at a time and can be cancelled or resumed.`)) generatePages(pending) }} className="rounded-md border border-brand px-3 py-2 text-xs font-bold text-brand disabled:opacity-50">Generate All Pending</button>{generating && <button type="button" onClick={() => { cancelRequested.current = true; setNotice('Cancel requested; the current generation will finish safely, then the batch stops.') }} className="rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700">Cancel batch</button>}<span className="text-xs text-muted-foreground">{generating ? `Progress ${progress.done}/${progress.total} · failed ${progress.failed}` : `${filtered.length} matching records`}</span></div>}
      <div className="overflow-x-auto"><table className="min-w-[1120px] w-full text-left text-sm"><thead className="bg-surface text-xs uppercase text-muted-foreground"><tr><th className="p-3">Select</th><th className="p-3">Location page</th><th className="p-3">Type</th><th className="p-3">Workflow</th><th className="p-3">SEO safety</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y divide-border">{visible.map((page) => <tr key={page.id}><td className="p-3"><input aria-label={`Select ${page.title}`} type="checkbox" checked={selected.includes(page.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, page.id] : selected.filter((id) => id !== page.id))} /></td><td className="p-3"><p className="font-semibold text-navy">{page.title}</p><p className="text-xs text-muted-foreground">/{page.slug}</p>{page.generationError && <p className="mt-1 text-xs text-red-700">Last error: {page.generationError}</p>}</td><td className="p-3 text-xs">{label(page.pageType)}</td><td className="p-3"><p className="text-xs font-bold text-navy">{label(page.status)} · {label(page.generationStatus)}</p><p className="mt-1 text-xs text-muted-foreground">{page.robotsIndex ? 'Indexable' : 'Noindex'} · {page.sitemap.include ? 'Sitemap' : 'No sitemap'}</p></td><td className="p-3 text-xs">{page.locationSeoRisk ? <span>Similarity {page.locationSeoRisk.contentSimilarityRisk} · {page.locationSeoRisk.thinContentRisk ? 'thin' : 'substantive'} · local {page.locationSeoRisk.locationDifferentiationRisk}</span> : 'Pending audit'}</td><td className="p-3"><div className="flex flex-wrap gap-2 text-xs font-bold"><Link href={`/admin/sections?page=${encodeURIComponent(page.id)}`} className="text-brand">Section Builder</Link><Link href={`/admin?selected=${encodeURIComponent(page.id)}`} className="text-brand">CMS editor</Link>{page.generationStatus === 'needs_review' && <button type="button" onClick={() => approve(page)} className="text-brand">Approve</button>}{page.generationStatus === 'approved' && <button type="button" onClick={() => publish(page)} className="text-brand">Publish noindex</button>}</div></td></tr>)}</tbody></table></div>
      <div className="mt-4 flex items-center justify-between text-sm"><button type="button" disabled={pageNumber === 1} onClick={() => setPageNumber(pageNumber - 1)} className="font-bold text-brand disabled:text-muted-foreground">Previous</button><span>{pageNumber} / {totalPages}</span><button type="button" disabled={pageNumber >= totalPages} onClick={() => setPageNumber(pageNumber + 1)} className="font-bold text-brand disabled:text-muted-foreground">Next</button></div>
    </section>
  </div></main>
}
