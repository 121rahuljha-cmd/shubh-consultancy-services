'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { registrationPages } from '@/lib/registration-pages'
import { getPages, type CmsPage } from '@/lib/page-cms'
import { getBuilderRecords, type ServiceBuilderRecord, saveBuilderRecords } from '@/lib/service-builder'
import { savePages as saveCmsPages } from '@/lib/page-cms'
import type { PublicPageDescriptor } from '@/lib/public-page-registry'

type Status = 'planned' | 'draft' | 'review' | 'published' | 'unpublished' | 'archived' | 'pending'
type PageRow = {
  id: string
  title: string
  slug: string
  url: string
  type: string
  status: Status
  source: string
  keyword: string
  updatedAt: string
  menu: 'yes' | 'no' | 'unknown'
  editUrl?: string
  seoUrl?: string
  aiUrl?: string
  duplicateKind?: 'cms' | 'builder'
  duplicateId?: string
  detailsUrl?: string
}
type ApiPage = Record<string, unknown>

const PAGE_SIZE = 50
const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'
const normalizeStatus = (value: unknown): Status => {
  const status = String(value || '').toLowerCase()
  if (['published', 'draft', 'planned', 'review', 'unpublished', 'archived', 'pending'].includes(status)) return status as Status
  if (status === 'pending_approval' || status === 'needs_review') return 'pending'
  return 'draft'
}
const cmsRow = (page: CmsPage): PageRow => ({
  id: `cms-${page.id}`, title: page.title || 'Untitled CMS page', slug: page.slug || '', url: page.pageType === 'article' ? `/blog/${page.slug}` : page.pageType === 'service' ? `/services/${page.slug}` : `/pages/${page.slug}`,
  type: page.pageType || 'page', status: normalizeStatus(page.status), source: 'Page CMS (this browser)', keyword: page.primaryKeyword || '', updatedAt: page.updatedAt || '', menu: 'no', editUrl: `/admin/pages?selected=${encodeURIComponent(page.id)}`, seoUrl: `/admin/pages?selected=${encodeURIComponent(page.id)}&tab=SEO`, aiUrl: `/admin/pages?selected=${encodeURIComponent(page.id)}&tab=AI`, duplicateKind: 'cms', duplicateId: page.id,
})
const builderRow = (record: ServiceBuilderRecord): PageRow => ({
  id: `builder-${record.id}`, title: record.pageTitle || record.serviceName || 'Untitled service', slug: record.slug || record.serviceSlug || '',
  url: `/services/${record.slug || record.serviceSlug}`, type: 'service', status: normalizeStatus(record.status), source: 'Service Builder (this browser)',
  keyword: record.seo?.primaryKeyword || record.serviceName || '', updatedAt: record.updatedAt || '', menu: record.visibility === 'visible' ? 'yes' : 'no',
  editUrl: `/admin/service-builder/edit?service=${encodeURIComponent(record.serviceSlug || record.slug)}`, seoUrl: `/admin/service-builder/edit?service=${encodeURIComponent(record.serviceSlug || record.slug)}&tab=SEO`, aiUrl: `/admin/service-builder/ai?service=${encodeURIComponent(record.serviceSlug || record.slug)}`, duplicateKind: 'builder', duplicateId: record.id,
})
const apiRow = (page: ApiPage): PageRow => {
  const isBuilder = typeof page.serviceName === 'string' || typeof page.serviceSlug === 'string'
  const slug = String(page.slug || page.serviceSlug || '')
  const title = String(page.title || page.pageTitle || page.serviceName || 'Untitled page')
  const type = String(page.pageType || (isBuilder ? 'service' : 'page'))
  return {
    id: `db-${String(page.id || slug || title)}`, title, slug,
    url: type === 'service' ? `/services/${slug}` : type === 'article' ? `/blog/${slug}` : `/pages/${slug}`,
    type, status: normalizeStatus(page.status), source: 'Database', keyword: String(page.primaryKeyword || page.keyword || ''),
    updatedAt: String(page.updatedAt || ''), menu: page.visibility === 'visible' ? 'yes' : page.visibility === 'hidden' ? 'no' : 'unknown',
    editUrl: isBuilder ? `/admin/service-builder/edit?service=${encodeURIComponent(String(page.serviceSlug || slug))}` : `/admin/pages?selected=${encodeURIComponent(String(page.id || ''))}`, seoUrl: isBuilder ? `/admin/service-builder/edit?service=${encodeURIComponent(String(page.serviceSlug || slug))}&tab=SEO` : `/admin/pages?selected=${encodeURIComponent(String(page.id || ''))}&tab=SEO`, aiUrl: isBuilder ? `/admin/service-builder/ai?service=${encodeURIComponent(String(page.serviceSlug || slug))}` : `/admin/pages?selected=${encodeURIComponent(String(page.id || ''))}&tab=AI`, duplicateKind: isBuilder ? 'builder' : 'cms', duplicateId: String(page.id || ''),
  }
}

export function ManagedPageDirectory({ publicPages = [] }: { publicPages?: PublicPageDescriptor[] }) {
  const [rows, setRows] = useState<PageRow[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [menu, setMenu] = useState('all')
  const [source, setSource] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [databaseMessage, setDatabaseMessage] = useState('Loading database records…')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const localCms = getPages().map(cmsRow)
      const localBuilder = getBuilderRecords().map(builderRow)
      const publicRouteRows: PageRow[] = publicPages.map((item) => ({ id: `public-${item.id}`, title: item.title, slug: item.slug, url: item.url, type: item.pageType, status: item.status === 'live' ? 'published' : normalizeStatus(item.status), source: item.source === 'service-data' ? 'Website service data' : item.source === 'location-data' ? 'Location data' : 'Public route', keyword: item.service || item.category || item.title, updatedAt: item.updatedAt || '', menu: 'unknown', editUrl: item.editorHref || item.detailsHref || undefined, seoUrl: item.editorHref ? `${item.editorHref}${item.editorHref.includes('?') ? '&' : '?'}tab=SEO` : undefined, aiUrl: item.aiHref || undefined, detailsUrl: item.detailsHref || undefined }))
      const catalog: PageRow[] = registrationPages.map((item) => ({
        id: `registration-${item.slug}`, title: item.title, slug: item.slug, url: `/registrations/${item.slug}`,
        type: 'registration', status: 'draft', source: 'Registration catalog', keyword: item.keyword || item.title,
        updatedAt: '', menu: 'yes', editUrl: undefined,
      }))
      let databaseRows: PageRow[] = []
      let message = 'Database records could not be loaded; local and catalog pages are still shown.'
      try {
        const response = await fetch('/api/pages?limit=10000', { credentials: 'same-origin', cache: 'no-store' })
        const payload = await response.json() as { pages?: ApiPage[]; error?: string }
        if (response.ok && Array.isArray(payload.pages)) {
          databaseRows = payload.pages.map(apiRow)
          message = `Loaded ${databaseRows.length.toLocaleString()} database record(s).`
        } else {
          message = payload.error || (response.status === 401 ? 'Sign in to load database-backed pages.' : 'Database records are unavailable.')
        }
      } catch {
        message = 'Database is unavailable; local and catalog pages are still shown.'
      }
      if (cancelled) return
      // Prefer the database copy when a page exists in both sources.
      const merged = [...databaseRows, ...localBuilder, ...localCms, ...publicRouteRows, ...catalog]
      const seen = new Set<string>()
      const unique = merged.filter((row) => {
        const key = row.url.toLowerCase()
        if (!key || key.endsWith('/')) return false
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).sort((a, b) => a.title.localeCompare(b.title))
      setRows(unique)
      setDatabaseMessage(message)
      setLoading(false)
    }
    void load()
    const refresh = () => { void load() }
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('scs-cms-pages-updated', refresh)
    window.addEventListener('scs-service-builder-updated', refresh)
    return () => { cancelled = true; window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); window.removeEventListener('scs-cms-pages-updated', refresh); window.removeEventListener('scs-service-builder-updated', refresh) }
  }, [])

  const filtered = useMemo(() => rows.filter((row) => {
    const haystack = `${row.title} ${row.slug} ${row.url} ${row.keyword} ${row.source} ${row.type}`.toLowerCase()
    return (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (status === 'all' || row.status === status)
      && (type === 'all' || row.type === type)
      && (menu === 'all' || row.menu === menu)
      && (source === 'all' || row.source === source)
  }), [rows, query, status, type, menu, source])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const updateFilter = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1) }
  const duplicateRow = (row: PageRow) => {
    if (!row.duplicateKind || !row.duplicateId) { window.alert('This route is generated or read-only. Open its source/editor to create an editable draft.'); return }
    if (row.duplicateKind === 'builder') {
      const original = getBuilderRecords().find((item) => item.id === row.duplicateId)
      if (!original) { window.alert('Builder record was not found in this browser.'); return }
      const copy = { ...original, id: `${original.id}-copy-${Date.now()}`, serviceName: `${original.serviceName} copy`, internalName: `${original.internalName} copy`, pageTitle: `${original.pageTitle} copy`, slug: `${original.slug}-copy`, serviceSlug: `${original.serviceSlug}-copy`, status: 'draft' as const, updatedAt: new Date().toISOString() }
      saveBuilderRecords([...getBuilderRecords(), copy])
    } else {
      const original = getPages().find((item) => item.id === row.duplicateId)
      if (!original) { window.alert('CMS record was not found in this browser.'); return }
      const copy = { ...original, id: crypto.randomUUID(), title: `${original.title} copy`, slug: `${original.slug}-copy`, status: 'draft' as const, publishedAt: '', updatedAt: new Date().toISOString() }
      saveCmsPages([...getPages(), copy])
    }
  }

  return <section className="mb-8 rounded-xl border border-border bg-background p-5 md:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">Unified content inventory</p><h2 className="mt-2 font-serif text-2xl font-bold text-navy">All service &amp; website pages</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Includes registration catalog pages, Service Builder records, CMS drafts and database-backed pages. A page can be managed here even when it is not linked in the website menu.</p></div>
      <div className="rounded-lg bg-brand-tint px-4 py-2 text-right"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matching pages</p><p className="font-serif text-2xl font-bold text-navy">{filtered.length.toLocaleString()}</p><p className="text-xs text-muted-foreground">{rows.length.toLocaleString()} total records</p></div>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="sm:col-span-2 lg:col-span-2"><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Search title, slug, URL or keyword</span><input className={inputClass} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="e.g. FSSAI, GST, Delhi, slug…" /></label>
      <label><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Status</span><select className={inputClass} value={status} onChange={(event) => updateFilter(setStatus)(event.target.value)}><option value="all">All statuses</option><option value="planned">Planned</option><option value="draft">Draft</option><option value="review">In review</option><option value="pending">Pending approval / review</option><option value="published">Published</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option></select></label>
      <label><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Page type</span><select className={inputClass} value={type} onChange={(event) => updateFilter(setType)(event.target.value)}><option value="all">All types</option>{[...new Set(rows.map((row) => row.type))].sort().map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
      <label><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Menu visibility</span><select className={inputClass} value={menu} onChange={(event) => updateFilter(setMenu)(event.target.value)}><option value="all">All pages</option><option value="yes">Linked in menu</option><option value="no">Not in menu</option><option value="unknown">Not determined</option></select></label>
      <label className="sm:col-span-2 lg:col-span-2"><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Created in</span><select className={inputClass} value={source} onChange={(event) => updateFilter(setSource)(event.target.value)}><option value="all">All sources</option>{[...new Set(rows.map((row) => row.source))].sort().map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{loading ? 'Loading records…' : databaseMessage} Search and filters apply across the records loaded from each source.</p><button type="button" onClick={() => { setQuery(''); setStatus('all'); setType('all'); setMenu('all'); setSource('all'); setPage(1) }} className="rounded-md border border-border px-3 py-2 text-xs font-bold text-navy hover:border-brand">Clear filters</button></div>
    <div className="mt-4 overflow-x-auto rounded-lg border border-border"><table className="min-w-[1050px] w-full text-left text-sm"><thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Page</th><th className="px-3 py-3">URL</th><th className="px-3 py-3">Type / Source</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Menu</th><th className="px-3 py-3">Updated</th><th className="px-3 py-3">Actions</th></tr></thead><tbody className="divide-y divide-border">{visible.map((row) => <tr key={row.id}><td className="px-3 py-3"><p className="font-semibold text-navy">{row.title}</p><p className="mt-1 text-xs text-muted-foreground">{row.keyword || row.slug}</p></td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{row.url}</td><td className="px-3 py-3"><p className="capitalize text-navy">{row.type.replaceAll('_', ' ')}</p><p className="mt-1 text-xs text-muted-foreground">{row.source}</p></td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : row.status === 'draft' || row.status === 'planned' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{row.status}</span></td><td className="px-3 py-3 text-xs">{row.menu === 'yes' ? 'Linked' : row.menu === 'no' ? 'Not linked' : 'Unknown'}</td><td className="px-3 py-3 text-xs text-muted-foreground">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold"><Link href={row.url} target="_blank" className="text-brand hover:underline">View</Link>{row.editUrl && <Link href={row.editUrl} className="text-navy hover:underline">Edit</Link>}{row.duplicateKind && <button type="button" onClick={() => duplicateRow(row)} className="text-navy hover:underline">Duplicate</button>}{row.seoUrl && <Link href={row.seoUrl} className="text-brand hover:underline">SEO Edit</Link>}{row.aiUrl && <Link href={row.aiUrl} className="text-brand hover:underline">AI Edit</Link>}</div></td></tr>)}</tbody></table></div>
    {!visible.length && <p className="p-8 text-center text-sm text-muted-foreground">No pages match these filters. Clear the filters or try a different search.</p>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}</p><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-border px-3 py-2 text-sm font-bold disabled:opacity-40">Previous</button><span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-md border border-border px-3 py-2 text-sm font-bold disabled:opacity-40">Next</button></div></div>
  </section>
}
