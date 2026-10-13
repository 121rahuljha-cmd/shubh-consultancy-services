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
  author: string
  comments: number | null
  pageviews: number | null
  seoScore: number | null
  schema: string
  internalLinks: number | null
  outboundLinks: number | null
  backlinks: number | null
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
  type: page.pageType || 'page', status: normalizeStatus(page.status), source: 'Page CMS (this browser)', keyword: page.primaryKeyword || '', updatedAt: page.updatedAt || '', menu: 'no', author: 'Current user', comments: null, pageviews: null, seoScore: null, schema: 'Auto', internalLinks: null, outboundLinks: null, backlinks: null, editUrl: `/admin/service-builder/edit?pageId=${encodeURIComponent(page.id)}`, seoUrl: `/admin/service-builder/edit?pageId=${encodeURIComponent(page.id)}&tab=SEO`, aiUrl: `/admin/pages?selected=${encodeURIComponent(page.id)}&tab=AI`, duplicateKind: 'cms', duplicateId: page.id,
})
const builderRow = (record: ServiceBuilderRecord): PageRow => ({
  id: `builder-${record.id}`, title: record.pageTitle || record.serviceName || 'Untitled service', slug: record.slug || record.serviceSlug || '',
  url: `/services/${record.slug || record.serviceSlug}`, type: 'service', status: normalizeStatus(record.status), source: 'Service Builder (this browser)',
  keyword: record.seo?.primaryKeyword || record.serviceName || '', updatedAt: record.updatedAt || '', menu: record.visibility === 'visible' ? 'yes' : 'no', author: 'Current user', comments: null, pageviews: null, seoScore: null, schema: 'service', internalLinks: null, outboundLinks: null, backlinks: null,
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
    updatedAt: String(page.updatedAt || ''), menu: page.visibility === 'visible' ? 'yes' : page.visibility === 'hidden' ? 'no' : 'unknown', author: String(page.author || '—'), comments: typeof page.comments === 'number' ? page.comments : null, pageviews: typeof page.pageviews === 'number' ? page.pageviews : null, seoScore: typeof page.seoScore === 'number' ? page.seoScore : null, schema: String(page.schemaType || page.schema || 'service'), internalLinks: typeof page.internalLinks === 'number' ? page.internalLinks : null, outboundLinks: typeof page.outboundLinks === 'number' ? page.outboundLinks : null, backlinks: typeof page.backlinks === 'number' ? page.backlinks : null,
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
  const [dateFilter, setDateFilter] = useState('all')
  const [seoFilter, setSeoFilter] = useState('all')
  const [sort, setSort] = useState<'title' | 'date' | 'seo'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')
  const [quickEditRow, setQuickEditRow] = useState<PageRow | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickSlug, setQuickSlug] = useState('')
  const [quickStatus, setQuickStatus] = useState('draft')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [databaseMessage, setDatabaseMessage] = useState('Loading database records…')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const localCms = getPages().map(cmsRow)
      const localBuilder = getBuilderRecords().map(builderRow)
      const publicRouteRows: PageRow[] = publicPages.map((item) => ({ id: `public-${item.id}`, title: item.title, slug: item.slug, url: item.url, type: item.pageType, status: item.status === 'live' ? 'published' : normalizeStatus(item.status), source: item.source === 'service-data' ? 'Website service data' : item.source === 'location-data' ? 'Location data' : 'Public route', keyword: item.service || item.category || '', updatedAt: item.updatedAt || '', menu: 'unknown', author: '—', comments: null, pageviews: null, seoScore: item.seoStatus === 'ready' ? 88 : null, schema: item.pageType === 'service' ? 'service' : 'webPage', internalLinks: null, outboundLinks: null, backlinks: null, editUrl: item.editorHref || (item.pageType === 'service' ? `/admin/service-builder/edit?service=${encodeURIComponent(item.slug)}` : undefined), seoUrl: item.editorHref ? `${item.editorHref}${item.editorHref.includes('?') ? '&' : '?'}tab=SEO` : item.pageType === 'service' ? `/admin/service-builder/edit?service=${encodeURIComponent(item.slug)}&tab=SEO` : undefined, aiUrl: item.aiHref || undefined, detailsUrl: item.detailsHref || undefined }))
      const catalog: PageRow[] = registrationPages.map((item) => ({
        id: `registration-${item.slug}`, title: item.title, slug: item.slug, url: `/registrations/${item.slug}`,
        type: 'registration', status: 'draft', source: 'Registration catalog', keyword: item.keyword || item.title,
        updatedAt: '', menu: 'yes', author: '—', comments: null, pageviews: null, seoScore: null, schema: 'service', internalLinks: null, outboundLinks: null, backlinks: null, editUrl: `/admin/service-builder/edit?service=${encodeURIComponent(item.slug)}`,
      }))
      let databaseRows: PageRow[] = []
      let blogRows: PageRow[] = []
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
      try {
        const response = await fetch('/api/blogs', { credentials: 'same-origin', cache: 'no-store' })
        const payload = await response.json() as { blogs?: ApiPage[] }
        if (response.ok && Array.isArray(payload.blogs)) {
          blogRows = payload.blogs.map((blog) => {
            const slug = String(blog.slug || '')
            const title = String(blog.title || 'Untitled blog')
            const statusValue = normalizeStatus(blog.status)
            return { id: `blog-${String(blog.id || slug)}`, title, slug, url: `/blog/${slug}`, type: 'article', status: statusValue, source: 'Blog CMS', keyword: String(blog.primaryKeyword || blog.keyword || ''), updatedAt: String(blog.updatedAt || ''), menu: 'unknown', author: String(blog.author || '—'), comments: null, pageviews: null, seoScore: typeof blog.seoScore === 'number' ? blog.seoScore : null, schema: 'article', internalLinks: null, outboundLinks: null, backlinks: null, editUrl: `/admin/blogs?edit=${encodeURIComponent(slug)}`, seoUrl: `/admin/blogs?edit=${encodeURIComponent(slug)}&tab=SEO`, aiUrl: `/admin/blogs?edit=${encodeURIComponent(slug)}&tab=AI`, duplicateKind: undefined, duplicateId: undefined }
          })
        }
      } catch { /* Blog records are optional if the blog API is unavailable. */ }
      if (cancelled) return
      // Prefer database records, then drafts from the blog API, before local and route catalogs.
      const merged = [...databaseRows, ...blogRows, ...localBuilder, ...localCms, ...publicRouteRows, ...catalog]
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
      saveBuilderRecords([...getBuilderRecords(), copy]); window.dispatchEvent(new Event('scs-service-builder-updated')); setNotice(`Created draft copy of ${row.title}.`)
    } else {
      const original = getPages().find((item) => item.id === row.duplicateId)
      if (!original) { window.alert('CMS record was not found in this browser.'); return }
      const copy = { ...original, id: crypto.randomUUID(), title: `${original.title} copy`, slug: `${original.slug}-copy`, status: 'draft' as const, publishedAt: '', updatedAt: new Date().toISOString() }
      saveCmsPages([...getPages(), copy]); window.dispatchEvent(new Event('scs-cms-pages-updated')); setNotice(`Created draft copy of ${row.title}.`)
    }
  }

  const startQuickEdit = (row: PageRow) => { setQuickEditRow(row); setQuickTitle(row.title); setQuickSlug(row.slug); setQuickStatus(row.status) }
  const saveQuickEdit = () => {
    if (!quickEditRow) return
    if (quickEditRow.duplicateKind === 'cms' && quickEditRow.duplicateId) {
      const all = getPages(); const next = all.map(item => item.id === quickEditRow.duplicateId ? { ...item, title: quickTitle, slug: quickSlug, status: quickStatus as CmsPage['status'], updatedAt: new Date().toISOString() } : item)
      saveCmsPages(next); window.dispatchEvent(new Event('scs-cms-pages-updated'))
    } else if (quickEditRow.duplicateKind === 'builder' && quickEditRow.duplicateId) {
      const all = getBuilderRecords(); const next = all.map(item => item.id === quickEditRow.duplicateId ? { ...item, pageTitle: quickTitle, slug: quickSlug, serviceSlug: quickSlug, status: quickStatus as ServiceBuilderRecord['status'], updatedAt: new Date().toISOString() } : item)
      saveBuilderRecords(next); window.dispatchEvent(new Event('scs-service-builder-updated'))
    } else { setNotice('Quick Edit is available for locally managed CMS and Service Builder records. Use Edit for database-backed pages.'); return }
    setRows(current => current.map(row => row.id === quickEditRow.id ? { ...row, title: quickTitle, slug: quickSlug, url: row.type === 'service' ? `/services/${quickSlug}` : row.type === 'article' ? `/blog/${quickSlug}` : `/pages/${quickSlug}`, status: normalizeStatus(quickStatus), updatedAt: new Date().toISOString() } : row))
    setQuickEditRow(null); setNotice('Quick Edit saved using the existing local editor storage.')
  }
  const applyBulkAction = () => {
    const selected = filtered.filter(row => selectedIds.includes(row.id))
    if (!selected.length) { setNotice('Select at least one page first.'); return }
    if (bulkAction === 'export') {
      const csv = ['Title,URL,Type,Status,Keyword,Source', ...selected.map(row => [row.title,row.url,row.type,row.status,row.keyword,row.source].map(value => `"${String(value).replaceAll('"','""')}"`).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const href = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'website-pages.csv'; anchor.click(); URL.revokeObjectURL(href); setNotice(`Exported ${selected.length} selected page(s).`); return
    }
    if (bulkAction === 'duplicate') { selected.forEach(duplicateRow); setSelectedIds([]); return }
    if (bulkAction === 'review') {
      const cmsIds = new Set(selected.filter(row => row.duplicateKind === 'cms').map(row => row.duplicateId))
      saveCmsPages(getPages().map(item => cmsIds.has(item.id) ? { ...item, status: 'review', updatedAt: new Date().toISOString() } : item))
      setRows(current => current.map(row => selectedIds.includes(row.id) && row.duplicateKind === 'cms' ? { ...row, status: 'review' } : row))
      window.dispatchEvent(new Event('scs-cms-pages-updated')); setNotice('Selected CMS pages marked for review. Other sources were left unchanged.'); setSelectedIds([]); return
    }
    setNotice('Choose a bulk action.')
  }
  const selectAllVisible = (checked: boolean) => setSelectedIds(checked ? [...new Set([...selectedIds, ...visible.map(row => row.id)])] : selectedIds.filter(id => !visible.some(row => row.id === id)))
  const monthOptions = [...new Set(rows.map(row => row.updatedAt ? new Date(row.updatedAt).toISOString().slice(0,7) : '').filter(Boolean))].sort().reverse()

  return <section className="mb-8 rounded border border-[#c3c4c7] bg-white p-4 text-[#1d2327] shadow-sm md:p-5">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-[#646970]">Pages / All Pages</p><h2 className="mt-1 text-2xl font-normal text-[#1d2327]">Pages <span className="text-base text-[#646970]">({filtered.length.toLocaleString()})</span></h2><p className="mt-1 text-sm text-[#646970]">WordPress-style page management for all website routes, services and CMS records.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/pages?new=1" className="rounded border border-[#2271b1] bg-[#f6f7f7] px-3 py-2 text-sm text-[#2271b1]">Add New</Link><button type="button" onClick={() => { setQuery(''); setStatus('all'); setType('all'); setMenu('all'); setSource('all'); setDateFilter('all'); setSeoFilter('all'); setPage(1) }} className="rounded border border-[#c3c4c7] px-3 py-2 text-sm">Reset filters</button></div>
    </div>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <select aria-label="Bulk actions" className="rounded border border-[#8c8f94] bg-white px-3 py-2 text-sm" value={bulkAction} onChange={e=>setBulkAction(e.target.value)}><option value="">Bulk actions</option><option value="review">Mark CMS pages for review</option><option value="duplicate">Clone selected</option><option value="export">Export selected CSV</option></select><button onClick={applyBulkAction} type="button" className="rounded border border-[#2271b1] px-3 py-2 text-sm text-[#2271b1]">Apply</button>
      <select aria-label="Filter by date" className="rounded border border-[#8c8f94] bg-white px-3 py-2 text-sm" value={dateFilter} onChange={e=>{setDateFilter(e.target.value);setPage(1)}}><option value="all">All dates</option>{monthOptions.map(month=><option key={month} value={month}>{month}</option>)}</select>
      <select aria-label="Rank Math SEO filter" className="rounded border border-[#8c8f94] bg-white px-3 py-2 text-sm" value={seoFilter} onChange={e=>{setSeoFilter(e.target.value);setPage(1)}}><option value="all">SEO: All</option><option value="good">SEO score 80+</option><option value="needs-work">SEO needs improvement</option><option value="not-set">Keyword not set</option></select>
      <button type="button" onClick={()=>setPage(1)} className="rounded border border-[#2271b1] px-3 py-2 text-sm text-[#2271b1]">Filter</button>
      <div className="ml-auto flex flex-wrap items-center gap-2"><input className="w-52 rounded border border-[#8c8f94] px-3 py-2 text-sm" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Search pages…" /><span className="text-sm text-[#646970]">{filtered.length} items</span><button disabled={page<=1} onClick={()=>setPage(1)} className="rounded border px-3 py-2 disabled:opacity-40" aria-label="First page">«</button><button disabled={page<=1} onClick={()=>setPage(v=>v-1)} className="rounded border px-3 py-2 disabled:opacity-40" aria-label="Previous page">‹</button><span className="rounded border px-3 py-2 text-sm">{page} of {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage(v=>v+1)} className="rounded border px-3 py-2 disabled:opacity-40" aria-label="Next page">›</button><button disabled={page>=totalPages} onClick={()=>setPage(totalPages)} className="rounded border px-3 py-2 disabled:opacity-40" aria-label="Last page">»</button></div>
    </div>
    <div className="mb-3 flex flex-wrap gap-2 text-sm text-[#2271b1]"><button onClick={()=>{setStatus('all');setPage(1)}}>All ({rows.length})</button><span>|</span><button onClick={()=>{setStatus('published');setPage(1)}}>Published ({rows.filter(r=>r.status==='published').length})</button><span>|</span><button onClick={()=>{setStatus('draft');setPage(1)}}>Drafts ({rows.filter(r=>r.status==='draft').length})</button><span>|</span><button onClick={()=>{setStatus('review');setPage(1)}}>In review ({rows.filter(r=>r.status==='review').length})</button><span>|</span><button onClick={()=>{setStatus('planned');setPage(1)}}>Planned ({rows.filter(r=>r.status==='planned').length})</button></div>
    {notice && <div role="status" className="mb-3 rounded border border-[#c3c4c7] bg-[#f6f7f7] p-3 text-sm">{notice}<button type="button" className="ml-3 text-[#2271b1] underline" onClick={()=>setNotice('')}>Dismiss</button></div>}
    <div className="overflow-x-auto border border-[#c3c4c7]"><table className="min-w-[1400px] w-full table-fixed border-collapse text-left text-sm">
      <thead><tr className="border-b border-[#c3c4c7] bg-[#f6f7f7] text-[#1d2327]"><th className="w-10 p-3"><input type="checkbox" aria-label="Select all visible pages" checked={visible.length>0&&visible.every(r=>selectedIds.includes(r.id))} onChange={e=>selectAllVisible(e.target.checked)} /></th><th className="w-[300px] p-3"><button onClick={()=>{setSort('title');setSortDirection(v=>v==='asc'?'desc':'asc')}}>Title ↕</button></th><th className="w-[190px] p-3">Author</th><th className="w-20 p-3">Comments ↕</th><th className="w-[180px] p-3"><button onClick={()=>{setSort('date');setSortDirection(v=>v==='asc'?'desc':'asc')}}>Date ↕</button></th><th className="w-[180px] p-3"><button onClick={()=>{setSort('seo');setSortDirection(v=>v==='asc'?'desc':'asc')}}>Rank Math ↕</button></th><th className="w-24 p-3">Pageviews</th><th className="w-[340px] p-3">SEO Details ✎</th></tr></thead>
      <tbody>{visible.map(row=><tr key={row.id} className="border-b border-[#f0f0f1] odd:bg-white even:bg-[#f6f7f7] align-top hover:bg-[#f0f6fc]">
        <td className="p-3"><input type="checkbox" aria-label={`Select ${row.title}`} checked={selectedIds.includes(row.id)} onChange={e=>setSelectedIds(ids=>e.target.checked?[...ids,row.id]:ids.filter(id=>id!==row.id))}/></td>
        <td className="p-3"><Link href={row.editUrl || row.url} className="font-medium text-[#2271b1] hover:text-[#135e96] hover:underline">{row.title}</Link><div className="mt-1 text-xs text-[#646970]">{row.source}</div><div className="mt-2 flex flex-wrap gap-x-1 text-xs leading-5"><Link href={row.editUrl || row.url} className="text-[#2271b1]">Edit</Link><span>|</span><button onClick={()=>startQuickEdit(row)} className="text-[#2271b1]">Quick Edit</button><span>|</span><button onClick={()=>{if(row.duplicateKind){duplicateRow(row)}else setNotice('Clone is available after the source page is connected to an editor.')}} className="text-[#2271b1]">Clone</button><span>|</span><button onClick={()=>duplicateRow(row)} className="text-[#2271b1]">New Draft</button><span>|</span><Link href={row.aiUrl || row.editUrl || row.url} className="text-[#2271b1]">Rewrite &amp; Republish</Link><span>|</span><button onClick={()=>{const url=`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent('https://shubhconsultancyservices.com/')}&url=${encodeURIComponent('https://shubhconsultancyservices.com'+row.url)}`;window.open(url,'_blank','noopener,noreferrer')}} className="text-[#2271b1]">Instant Indexing ↗</button><span>|</span><button onClick={()=>{if(row.duplicateKind==='cms'&&row.duplicateId){saveCmsPages(getPages().map(p=>p.id===row.duplicateId?{...p,status:'archived',updatedAt:new Date().toISOString()}:p));setRows(rs=>rs.map(r=>r.id===row.id?{...r,status:'archived',updatedAt:new Date().toISOString()}:r));window.dispatchEvent(new Event('scs-cms-pages-updated'));setNotice('Page moved to Archived (soft trash); its content is preserved.')}else if(row.duplicateKind==='builder'&&row.duplicateId){const next=getBuilderRecords().map(item=>item.id===row.duplicateId?{...item,status:'archived' as const,updatedAt:new Date().toISOString()}:item);saveBuilderRecords(next);setRows(rs=>rs.map(r=>r.id===row.id?{...r,status:'archived',updatedAt:new Date().toISOString()}:r));setNotice('Service moved to Archived; its content is preserved.')}else setNotice('This page source is generated or catalog-based. It cannot be deleted here; no content was removed.')}} className="text-red-600">Trash</button><span>|</span><Link href={row.url} target="_blank" className="text-[#2271b1]">View</Link></div></td>
        <td className="p-3 text-[#50575e]">{row.author}</td><td className="p-3 text-[#646970]">{row.comments===null?'—':row.comments}</td><td className="p-3 text-[#50575e]">{row.status==='published'?'Published':row.status.replaceAll('_',' ')}<div className="mt-1 text-xs text-[#646970]">{row.updatedAt?new Date(row.updatedAt).toLocaleString():'—'}</div></td>
        <td className="p-3">{row.seoScore===null?<span className="rounded bg-[#dcdcde] px-2 py-1 text-xs">N/A</span>:<span className={`rounded px-2 py-1 text-xs font-bold text-white ${row.seoScore>=80?'bg-[#46b450]':'bg-[#dba617]'}`}>{row.seoScore} / 100</span>}<div className="mt-2 text-xs">Keyword: {row.keyword||'Not Set'}</div><div className="mt-1 text-xs">Schema: {row.schema}</div><div className="mt-2 text-xs text-[#646970]">Links: ↗ {row.internalLinks??0}　↗ {row.outboundLinks??0}　↙ {row.backlinks??0}</div></td>
        <td className="p-3 text-[#50575e]">{row.pageviews===null?'—':row.pageviews}</td><td className="p-3"><div className="flex flex-wrap gap-2 text-xs"><Link href={row.editUrl||row.url} className="text-[#2271b1]">Edit page</Link>{row.seoUrl&&<Link href={row.seoUrl} className="text-[#2271b1]">SEO Details ✎</Link>}{row.aiUrl&&<Link href={row.aiUrl} className="text-[#2271b1]">AI Edit</Link>}</div><div className="mt-2 text-xs text-[#646970]">SEO audit details are shown only when the source provides a score and link metrics.</div></td>
      </tr>)}</tbody></table></div>
    {!visible.length&&<p className="p-8 text-center text-sm text-[#646970]">No pages match these filters. Clear filters or try another search.</p>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-[#646970]">Showing {filtered.length?(page-1)*PAGE_SIZE+1:0}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length.toLocaleString()}</p><div className="flex items-center gap-2"><button disabled={page<=1} onClick={()=>setPage(1)} className="rounded border px-3 py-2 disabled:opacity-40">«</button><button disabled={page<=1} onClick={()=>setPage(v=>v-1)} className="rounded border px-3 py-2 disabled:opacity-40">‹</button><span className="rounded border px-3 py-2">{page} of {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage(v=>v+1)} className="rounded border px-3 py-2 disabled:opacity-40">›</button><button disabled={page>=totalPages} onClick={()=>setPage(totalPages)} className="rounded border px-3 py-2 disabled:opacity-40">»</button></div></div>
    {quickEditRow&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="quick-edit-title" className="w-full max-w-xl rounded bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h3 id="quick-edit-title" className="text-lg font-semibold">Quick Edit: {quickEditRow.title}</h3><button onClick={()=>setQuickEditRow(null)} className="text-xl">×</button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Title<input className={inputClass} value={quickTitle} onChange={e=>setQuickTitle(e.target.value)}/></label><label className="text-sm">Slug<input className={inputClass} value={quickSlug} onChange={e=>setQuickSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g,'-'))}/></label><label className="text-sm">Status<select className={inputClass} value={quickStatus} onChange={e=>setQuickStatus(e.target.value)}>{['draft','review','published','unpublished','planned','archived'].map(value=><option key={value}>{value}</option>)}</select></label></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setQuickEditRow(null)} className="rounded border px-4 py-2 text-sm">Cancel</button><button onClick={saveQuickEdit} className="rounded border border-[#2271b1] bg-[#2271b1] px-4 py-2 text-sm text-white">Update</button></div></div></div>}
  </section>
}
