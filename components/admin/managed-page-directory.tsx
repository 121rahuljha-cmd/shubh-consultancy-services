'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createEmptyPage, getPages, savePages, type CmsPage } from '@/lib/page-cms'
import { getBuilderRecords, type ServiceBuilderRecord } from '@/lib/service-builder'
import type { PublicPageDescriptor } from '@/lib/public-page-registry'

type Status = 'planned' | 'draft' | 'review' | 'published' | 'unpublished' | 'archived' | 'pending'
type EditorKind = 'service' | 'cms' | 'route' | 'blog' | 'clients' | 'locations' | 'categories' | 'cms-draft'
type Mode = 'edit' | 'seo' | 'ai'
type PageRow = {
  id: string
  title: string
  slug: string
  url: string
  type: string
  status: Status
  source: string
  keyword: string
  description: string
  updatedAt: string
  menu: 'yes' | 'no' | 'unknown'
  editor: EditorKind
  cmsId?: string
  routeKey?: string
}
type ApiPage = Record<string, unknown>

const PAGE_SIZE = 50
const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'
const routeKeys: Record<string, string> = { '/': 'home', '/services': 'services', '/contact': 'contact' }
const sourceRank: Record<string, number> = { Database: 0, 'Service Builder': 1, 'Page CMS': 2, 'Website route': 3, 'Registration catalog': 4 }

const normalizeStatus = (value: unknown): Status => {
  const status = String(value || '').toLowerCase()
  if (status === 'live') return 'published'
  if (['published', 'draft', 'planned', 'review', 'unpublished', 'archived', 'pending'].includes(status)) return status as Status
  if (status === 'pending_approval' || status === 'needs_review') return 'pending'
  if (status === 'private') return 'unpublished'
  return 'draft'
}

const cmsRow = (page: CmsPage): PageRow => ({
  id: `cms-${page.id}`, title: page.title || 'Untitled CMS page', slug: page.slug || '', url: page.pageType === 'article' ? `/blog/${page.slug}` : `/pages/${page.slug}`,
  type: page.pageType || 'page', status: normalizeStatus(page.status), source: 'Page CMS', keyword: page.primaryKeyword || '', description: page.metaDescription || '',
  updatedAt: page.updatedAt || '', menu: 'no', editor: 'cms', cmsId: page.id,
})

const builderRow = (record: ServiceBuilderRecord): PageRow => ({
  id: `builder-${record.id}`, title: record.pageTitle || record.serviceName || 'Untitled service', slug: record.serviceSlug || record.slug || '',
  url: `/services/${record.slug || record.serviceSlug}`, type: 'service', status: normalizeStatus(record.status), source: 'Service Builder',
  keyword: record.seo?.primaryKeyword || record.serviceName || '', description: record.shortDescription || '', updatedAt: record.updatedAt || '',
  menu: record.visibility === 'visible' ? 'yes' : 'no', editor: 'service',
})

const apiRow = (page: ApiPage): PageRow => {
  const isBuilder = typeof page.serviceName === 'string' || typeof page.serviceSlug === 'string'
  const slug = String(page.serviceSlug || page.slug || '')
  const title = String(page.title || page.pageTitle || page.serviceName || 'Untitled page')
  const type = String(page.pageType || (isBuilder ? 'service' : 'page'))
  const isService = isBuilder || type === 'service'
  return {
    id: `db-${String(page.id || slug || title)}`, title, slug,
    url: isService ? `/services/${String(page.slug || slug)}` : type === 'article' ? `/blog/${slug}` : `/pages/${slug}`,
    type, status: normalizeStatus(page.status), source: 'Database', keyword: String(page.primaryKeyword || page.keyword || ''),
    description: String(page.metaDescription || page.shortDescription || ''), updatedAt: String(page.updatedAt || ''),
    menu: page.visibility === 'visible' ? 'yes' : page.visibility === 'hidden' ? 'no' : 'unknown',
    editor: isService ? 'service' : 'cms', cmsId: isService ? undefined : String(page.id || ''),
  }
}

const publicEditor = (page: PublicPageDescriptor): EditorKind => {
  if (page.pageType === 'service') return 'service'
  if (page.pageType === 'blog') return 'blog'
  if (routeKeys[page.url]) return 'route'
  if (page.url === '/clients') return 'clients'
  if (page.url === '/states' || page.url === '/cities') return 'locations'
  if (page.url.startsWith('/services/category/')) return 'categories'
  return 'cms-draft'
}

const publicRow = (page: PublicPageDescriptor): PageRow => ({
  id: page.id, title: page.title, slug: page.serviceId || page.slug, url: page.url, type: page.pageType, status: normalizeStatus(page.status),
  source: 'Website route', keyword: page.serviceName || page.category || page.title, description: page.description || '',
  updatedAt: page.updatedAt || '', menu: 'unknown', editor: publicEditor(page), routeKey: routeKeys[page.url],
})

function editorHref(row: PageRow, mode: Mode): string | null {
  const slug = encodeURIComponent(row.slug)
  switch (row.editor) {
    case 'service':
      if (mode === 'ai') return `/admin/service-builder/ai?service=${slug}`
      return `/admin/service-builder/edit?service=${slug}${mode === 'seo' ? '&tab=SEO' : ''}`
    case 'cms':
      if (!row.cmsId) return null
      return `/admin/pages?selected=${encodeURIComponent(row.cmsId)}${mode === 'seo' ? '&tab=SEO' : mode === 'ai' ? '&ai=1' : ''}#page-editor`
    case 'route':
      return mode === 'ai' ? null : `/admin/public-routes?route=${row.routeKey}`
    case 'blog':
      return mode === 'ai' ? null : `/admin/blogs?slug=${slug}`
    case 'clients':
      return mode === 'ai' ? null : '/admin/clients'
    case 'locations':
      return mode === 'ai' ? null : '/admin/service-locations'
    case 'categories':
      return mode === 'ai' ? null : '/admin/services'
    default:
      return null
  }
}

function cmsDraftFrom(row: PageRow, copy: boolean): CmsPage {
  const base = createEmptyPage()
  const slug = (row.slug || row.url.replace(/^\/+/, '').replaceAll('/', '-') || 'page').toLowerCase()
  return {
    ...base,
    title: copy ? `${row.title} copy` : row.title,
    slug: copy ? `${slug}-copy` : slug,
    pageType: row.type === 'blog' ? 'article' : row.type === 'service' ? 'service' : 'page',
    status: 'draft',
    serviceId: row.type === 'service' ? row.slug : '',
    primaryKeyword: row.keyword,
    seoTitle: row.title,
    metaDescription: row.description,
    h1: row.title,
    canonicalUrl: copy ? '' : row.url,
  }
}

export function ManagedPageDirectory({ publicPages = [] }: { publicPages?: PublicPageDescriptor[] }) {
  const router = useRouter()
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
      const routes = publicPages.map(publicRow)
      let databaseRows: PageRow[] = []
      let message = 'Database records could not be loaded; website and local pages are still shown.'
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
        message = 'Database is unavailable; website and local pages are still shown.'
      }
      if (cancelled) return
      const byUrl = new Map<string, PageRow>()
      for (const row of [...databaseRows, ...localBuilder, ...localCms, ...routes]) {
        const key = row.url.toLowerCase()
        if (!key || (key !== '/' && key.endsWith('/'))) continue
        const existing = byUrl.get(key)
        if (!existing || (sourceRank[row.source] ?? 9) < (sourceRank[existing.source] ?? 9)) byUrl.set(key, row)
      }
      // A route that is live on the website is published, even if an editor copy is still marked draft.
      for (const route of routes) {
        const key = route.url.toLowerCase()
        const kept = byUrl.get(key)
        if (kept && kept.id !== route.id && route.status === 'published' && kept.status === 'draft') byUrl.set(key, { ...kept, status: 'published' })
      }
      setRows([...byUrl.values()].sort((a, b) => a.title.localeCompare(b.title)))
      setDatabaseMessage(message)
      setLoading(false)
    }
    void load()
    const refresh = () => { void load() }
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => { cancelled = true; window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh) }
  }, [publicPages])

  const filtered = useMemo(() => rows.filter((row) => {
    const haystack = `${row.title} ${row.slug} ${row.url} ${row.keyword} ${row.source} ${row.type}`.toLowerCase()
    return (!query.trim() || haystack.includes(query.trim().toLowerCase()))
      && (status === 'all' || row.status === status)
      && (type === 'all' || row.type === type)
      && (menu === 'all' || row.menu === menu)
      && (source === 'all' || row.source === source)
  }), [rows, query, status, type, menu, source])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const updateFilter = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1) }
  const clearFilters = () => { setQuery(''); setStatus('all'); setType('all'); setMenu('all'); setSource('all'); setPage(1) }

  const openCmsDraft = (row: PageRow, mode: Mode | 'duplicate') => {
    const pages = getPages()
    const copy = mode === 'duplicate'
    const draft = cmsDraftFrom(row, copy)
    const existing = copy ? undefined : pages.find((item) => item.slug === draft.slug || (row.url && item.canonicalUrl === row.url))
    const target = existing ?? draft
    if (!existing) savePages([...pages, draft])
    const suffix = mode === 'seo' ? '&tab=SEO' : mode === 'ai' ? '&ai=1' : ''
    router.push(`/admin/pages?selected=${encodeURIComponent(target.id)}${suffix}#page-editor`)
  }

  const go = (row: PageRow, mode: Mode) => {
    const href = editorHref(row, mode)
    if (href) router.push(href)
    else openCmsDraft(row, mode)
  }

  const actionClass = 'rounded-md border border-border px-2 py-1 text-xs font-bold text-navy hover:border-brand hover:text-brand'

  return <section className="mb-8 rounded-xl border border-border bg-background p-5 md:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">Content inventory</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">Pages</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Every website, service, blog, CMS and catalog page in one list. Use search and filters to find published, draft or any other status.</p></div>
      <div className="rounded-lg bg-brand-tint px-4 py-2 text-right"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matching pages</p><p className="font-serif text-2xl font-bold text-navy">{filtered.length.toLocaleString()}</p><p className="text-xs text-muted-foreground">{rows.length.toLocaleString()} total pages</p></div>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Search title, slug, URL or keyword</span><input className={inputClass} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="e.g. FSSAI, GST, Delhi, slug…" /></label>
      <label><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Status</span><select className={inputClass} value={status} onChange={(event) => updateFilter(setStatus)(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="planned">Planned</option><option value="review">In review</option><option value="pending">Pending approval</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option></select></label>
      <label><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Page type</span><select className={inputClass} value={type} onChange={(event) => updateFilter(setType)(event.target.value)}><option value="all">All types</option>{[...new Set(rows.map((row) => row.type))].sort().map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
      <label><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Menu visibility</span><select className={inputClass} value={menu} onChange={(event) => updateFilter(setMenu)(event.target.value)}><option value="all">All pages</option><option value="yes">Linked in menu</option><option value="no">Not in menu</option><option value="unknown">Not determined</option></select></label>
      <label><span className="mb-1.5 block text-xs font-bold text-muted-foreground">Source</span><select className={inputClass} value={source} onChange={(event) => updateFilter(setSource)(event.target.value)}><option value="all">All sources</option>{[...new Set(rows.map((row) => row.source))].sort().map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground" aria-live="polite">{loading ? 'Loading pages…' : databaseMessage}</p><button type="button" onClick={clearFilters} className="rounded-md border border-border px-3 py-2 text-xs font-bold text-navy hover:border-brand">Clear filters</button></div>
    <div className="mt-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Page</th><th className="px-3 py-3">URL</th><th className="px-3 py-3">Type / Source</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Menu</th><th className="px-3 py-3">Updated</th><th className="px-3 py-3">Actions</th></tr></thead>
        <tbody className="divide-y divide-border">{visible.map((row) => <tr key={row.id}>
          <td className="px-3 py-3"><p className="font-semibold text-navy">{row.title}</p><p className="mt-1 text-xs text-muted-foreground">{row.keyword || row.slug}</p></td>
          <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{row.url}</td>
          <td className="px-3 py-3"><p className="capitalize text-navy">{row.type.replaceAll('_', ' ').replaceAll('-', ' ')}</p><p className="mt-1 text-xs text-muted-foreground">{row.source}</p></td>
          <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${row.status === 'published' ? 'bg-emerald-100 text-emerald-700' : row.status === 'draft' || row.status === 'planned' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{row.status}</span></td>
          <td className="px-3 py-3 text-xs">{row.menu === 'yes' ? 'Linked' : row.menu === 'no' ? 'Not linked' : '—'}</td>
          <td className="px-3 py-3 text-xs text-muted-foreground">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</td>
          <td className="px-3 py-3"><div className="flex flex-wrap gap-1.5">
            <Link href={row.url} target="_blank" rel="noreferrer" className={actionClass}>View</Link>
            <button type="button" onClick={() => go(row, 'edit')} className={`${actionClass} border-brand text-brand`}>Edit</button>
            <button type="button" onClick={() => openCmsDraft(row, 'duplicate')} className={actionClass}>Duplicate</button>
            <button type="button" onClick={() => go(row, 'seo')} className={actionClass}>SEO Edit</button>
            <button type="button" onClick={() => go(row, 'ai')} className={actionClass}>AI Edit</button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    {!loading && !visible.length && <p className="p-8 text-center text-sm text-muted-foreground">No pages match these filters. Clear the filters or try a different search.</p>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Showing {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}</p><div className="flex items-center gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => setPage(Math.max(1, currentPage - 1))} className="rounded-md border border-border px-3 py-2 text-sm font-bold disabled:opacity-40">Previous</button><span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(Math.min(totalPages, currentPage + 1))} className="rounded-md border border-border px-3 py-2 text-sm font-bold disabled:opacity-40">Next</button></div></div>
  </section>
}
