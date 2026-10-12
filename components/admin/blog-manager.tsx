'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Status = 'draft' | 'published' | 'unpublished' | 'archived'
type Section = { id: string; title: string; content: string; displayOrder: number; status: 'active' | 'disabled' }
type Faq = { id: string; question: string; answer: string; displayOrder: number; status: 'active' | 'draft' }
type RelatedLink = { id: string; anchorText: string; url: string; description: string; displayOrder: number; status: 'active' | 'draft'; openInNewTab: boolean }
type ImageData = { image: string; altText: string; title: string; caption: string; description: string }
type Seo = { primaryKeyword: string; secondaryKeywords: string; seoTitle: string; metaDescription: string; canonicalUrl: string; robotsIndex: boolean; robotsFollow: boolean; ogTitle: string; ogDescription: string; ogImage: string; twitterTitle: string; twitterDescription: string; twitterImage: string }
type Intent = { searchIntent: string; targetAudience: string; targetLocation: string; relatedTopics: string; relatedEntities: string }
type Draft = { id: string; title: string; slug: string; excerpt: string; author: string; category: string; tags: string[]; status: Status; summary: string; introduction: string; body: string; conclusion: string; sections: Section[]; links: RelatedLink[]; faqs: Faq[]; featuredImage: ImageData; seo: Seo; intent: Intent; schema: Record<string, string>; sitemap: { include: boolean; priority: string; changeFrequency: string } }
type RecordBlog = { id: string; title: string; slug: string; content?: unknown; updatedAt?: string; createdAt?: string; publishedAt?: string | null; version?: number; status?: Status; excerpt?: string; author?: string; category?: string; tags?: unknown; featuredImage?: unknown; seo?: unknown; sections?: unknown }
type Revision = { id: string; version: number; status: string; changeType: string; createdAt: string }

const input = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'
const tabs = ['Basic', 'Intent', 'SEO', 'Content', 'Links', 'FAQ', 'Media', 'Schema', 'Sitemap', 'Audit', 'Preview', 'Revisions'] as const
type Tab = typeof tabs[number]
const emptyImage = (): ImageData => ({ image: '', altText: '', title: '', caption: '', description: '' })
const emptySeo = (): Seo => ({ primaryKeyword: '', secondaryKeywords: '', seoTitle: '', metaDescription: '', canonicalUrl: '', robotsIndex: true, robotsFollow: true, ogTitle: '', ogDescription: '', ogImage: '', twitterTitle: '', twitterDescription: '', twitterImage: '' })
const emptyIntent = (): Intent => ({ searchIntent: 'informational', targetAudience: '', targetLocation: '', relatedTopics: '', relatedEntities: '' })
const blank = (): Draft => ({ id: '', title: '', slug: '', excerpt: '', author: '', category: '', tags: [], status: 'draft', summary: '', introduction: '', body: '', conclusion: '', sections: [], links: [], faqs: [], featuredImage: emptyImage(), seo: emptySeo(), intent: emptyIntent(), schema: { article: 'auto', breadcrumbList: 'auto', faqPage: 'auto', organization: 'auto' }, sitemap: { include: true, priority: '0.7', changeFrequency: 'monthly' } })
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
const str = (v: unknown) => typeof v === 'string' ? v : ''
const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : []

function fromRecord(blog: RecordBlog): Draft {
  const c = obj(blog.content), seo = obj(blog.seo), intent = obj(seo.intent)
  const sections = arr<Section>(blog.sections).length ? arr<Section>(blog.sections) : arr<Section>(c.sections)
  return {
    ...blank(), id: blog.id, title: blog.title || '', slug: blog.slug || '',
    excerpt: str(blog.excerpt || c.summary || c.excerpt), author: str(blog.author), category: str(blog.category),
    tags: arr<string>(blog.tags), status: (['published', 'unpublished', 'archived'].includes(String(blog.status).toLowerCase()) ? String(blog.status).toLowerCase() : 'draft') as Status, summary: str(c.summary || blog.excerpt),
    introduction: str(c.introduction || c.intro), body: typeof blog.content === 'string' ? blog.content : str(c.body || c.content || c.text || c.markdown),
    conclusion: str(c.conclusion), sections, links: arr<RelatedLink>(seo.links), faqs: arr<Faq>(seo.faqs),
    featuredImage: { ...emptyImage(), ...obj(blog.featuredImage) } as ImageData,
    seo: { ...emptySeo(), ...seo } as Seo, intent: { ...emptyIntent(), ...intent } as Intent,
    schema: { ...blank().schema, ...obj(seo.schema) } as Record<string, string>,
    sitemap: { ...blank().sitemap, ...obj(seo.sitemap) } as Draft['sitemap'],
  }
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy"><span>{label}</span>{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>
}
function Text({ value, onChange, rows = 4, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <textarea className={input + ' resize-y'} rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
}
function Pill({ value }: { value: string }) {
  const color = value === 'published' ? 'bg-emerald-100 text-emerald-700' : value === 'archived' ? 'bg-slate-200 text-slate-700' : value === 'unpublished' ? 'bg-amber-100 text-amber-800' : 'bg-surface text-muted-foreground'
  return <span className={'inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ' + color}>{value}</span>
}

export function BlogManager() {
  const router = useRouter()
  const [blogs, setBlogs] = useState<RecordBlog[]>([])
  const [form, setForm] = useState<Draft>(blank)
  const [tab, setTab] = useState<Tab>('Basic')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [revisionLoading, setRevisionLoading] = useState(false)

  const requireLogin = useCallback(() => { router.replace('/admin/login?next=%2Fadmin%2Fblogs'); router.refresh() }, [router])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/blogs', { cache: 'no-store', credentials: 'same-origin' })
      const data = await response.json() as { blogs?: RecordBlog[]; error?: string }
      if (response.status === 401) { requireLogin(); return }
      if (!response.ok) throw new Error(data.error || 'Blogs could not be loaded.')
      setBlogs(data.blogs || [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Blogs could not be loaded.') }
    finally { setLoading(false) }
  }, [requireLogin])
  useEffect(() => { void load() }, [load])

  const loadRevisions = async (id = form.id) => {
    if (!id) { setRevisions([]); return }
    setRevisionLoading(true)
    try {
      const response = await fetch('/api/blogs/' + encodeURIComponent(id) + '/revisions', { cache: 'no-store', credentials: 'same-origin' })
      const data = await response.json() as { revisions?: Revision[]; error?: string }
      if (response.status === 401) { requireLogin(); return }
      if (!response.ok) throw new Error(data.error || 'Revision history could not be loaded.')
      setRevisions(data.revisions || [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Revision history could not be loaded.') }
    finally { setRevisionLoading(false) }
  }

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setForm(current => ({ ...current, [key]: value }))
  const updateSeo = (key: keyof Seo, value: string | boolean) => setForm(current => ({ ...current, seo: { ...current.seo, [key]: value } }))
  const updateIntent = (key: keyof Intent, value: string) => setForm(current => ({ ...current, intent: { ...current.intent, [key]: value } }))
  const updateImage = (key: keyof ImageData, value: string) => setForm(current => ({ ...current, featuredImage: { ...current.featuredImage, [key]: value } }))
  const clear = () => { setForm(blank()); setTab('Basic'); setRevisions([]); setNotice(''); setError('') }
  const edit = (blog: RecordBlog) => { setForm(fromRecord(blog)); setTab('Basic'); setNotice(''); setError(''); setRevisions([]); void loadRevisions(blog.id) }
  const filtered = useMemo(() => blogs.filter(blog => {
    const haystack = [blog.title, blog.slug, blog.category || '', ...arr<string>(blog.tags)].join(' ').toLowerCase()
    return haystack.includes(query.trim().toLowerCase()) && (filter === 'all' || (blog.status || 'draft') === filter)
  }), [blogs, query, filter])

  const save = async (status: Status) => {
    setSaving(true); setNotice(''); setError('')
    const title = form.title.trim(), slug = form.slug.trim()
    if (!title || !slug) { setError('Title and slug are required.'); setTab('Basic'); setSaving(false); return }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setError('Slug must use lowercase letters, numbers and hyphens.'); setTab('Basic'); setSaving(false); return }
    if (!form.body.trim() && !form.sections.some(section => section.content.trim())) { setError('Add article content or at least one content section before saving.'); setTab('Content'); setSaving(false); return }
    const content = { summary: form.summary || form.excerpt, introduction: form.introduction, body: form.body, conclusion: form.conclusion, sections: form.sections }
    const seo = { ...form.seo, intent: form.intent, links: form.links, faqs: form.faqs, schema: form.schema, sitemap: form.sitemap }
    try {
      const response = await fetch('/api/blogs', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: form.id || undefined, title, slug, excerpt: form.excerpt, author: form.author, category: form.category, tags: form.tags, featuredImage: form.featuredImage, content, sections: form.sections, seo, status }) })
      const data = await response.json() as { blog?: RecordBlog; error?: string }
      if (response.status === 401) { requireLogin(); return }
      if (!response.ok) throw new Error(data.error || 'Blog could not be saved.')
      const savedId = data.blog?.id || form.id
      setForm(current => ({ ...current, id: savedId, status }))
      setNotice(status === 'published' ? 'Blog published successfully.' : status === 'unpublished' ? 'Blog unpublished successfully.' : status === 'archived' ? 'Blog archived successfully.' : 'Draft saved successfully.')
      await load()
      if (savedId) await loadRevisions(savedId)
    } catch (e) { setError(e instanceof Error ? e.message : 'Blog could not be saved.') }
    finally { setSaving(false) }
  }

  const duplicate = (blog: RecordBlog) => { const copy = fromRecord(blog); setForm({ ...copy, id: '', title: copy.title + ' copy', slug: copy.slug + '-copy', status: 'draft' }); setTab('Basic'); setRevisions([]); setNotice(''); setError('') }
  const remove = async (blog: RecordBlog) => {
    if (!window.confirm('Delete "' + blog.title + '"? This permanently removes the blog and its revision history.')) return
    try {
      const response = await fetch('/api/blogs/' + encodeURIComponent(blog.id), { method: 'DELETE', credentials: 'same-origin' })
      const data = await response.json() as { error?: string }
      if (response.status === 401) { requireLogin(); return }
      if (!response.ok) throw new Error(data.error || 'Blog could not be deleted.')
      if (form.id === blog.id) clear()
      setNotice('Blog deleted.'); setError(''); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Blog could not be deleted.') }
  }
  const restore = async (revision: Revision) => {
    if (!form.id || !window.confirm('Restore version ' + revision.version + ' as a new draft?')) return
    try {
      const response = await fetch('/api/blogs/' + encodeURIComponent(form.id) + '/revisions', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revisionId: revision.id }) })
      const data = await response.json() as { blog?: RecordBlog; error?: string }
      if (response.status === 401) { requireLogin(); return }
      if (!response.ok || !data.blog) throw new Error(data.error || 'Revision could not be restored.')
      setForm(fromRecord(data.blog)); setNotice('Version ' + revision.version + ' restored as a draft.'); setError(''); await load(); await loadRevisions(data.blog.id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Revision could not be restored.') }
  }

  const checks = [
    { label: 'SEO title', ok: Boolean(form.seo.seoTitle.trim()), detail: form.seo.seoTitle.length + '/60 characters' },
    { label: 'Meta description', ok: Boolean(form.seo.metaDescription.trim()), detail: form.seo.metaDescription.length + '/160 characters' },
    { label: 'Primary keyword', ok: Boolean(form.seo.primaryKeyword.trim()), detail: form.seo.primaryKeyword || 'Not set' },
    { label: 'Canonical URL', ok: Boolean(form.seo.canonicalUrl.trim()), detail: form.seo.canonicalUrl || 'Not set' },
    { label: 'Article content', ok: Boolean(form.body.trim() || form.sections.some(section => section.content.trim())), detail: form.body.trim().split(/\s+/).filter(Boolean).length + ' body words' },
    { label: 'Image alt text', ok: Boolean(form.featuredImage.image && form.featuredImage.altText), detail: form.featuredImage.image ? (form.featuredImage.altText || 'Alt text missing') : 'No image selected' },
    { label: 'Internal links', ok: form.links.some(item => item.status === 'active' && item.url.trim()), detail: form.links.length + ' configured' },
    { label: 'FAQs', ok: form.faqs.some(item => item.status === 'active' && item.question.trim() && item.answer.trim()), detail: form.faqs.length + ' configured' },
    { label: 'Slug format', ok: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug), detail: form.slug || 'Not set' },
  ]
  const score = Math.round(checks.filter(item => item.ok).length / checks.length * 100)

  return <main className="min-h-screen bg-surface"><div className="mx-auto max-w-[1500px] px-4 py-8 md:px-8">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Admin / content</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">Blog Management <span className="text-base font-normal text-muted-foreground">/ SEO editor</span></h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Structured publishing workspace with SEO, content sections, media, links, FAQs, schema, audit, preview and revision history.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin" className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">Dashboard</Link><Link href="/blog" target="_blank" className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">View public blog</Link><button type="button" onClick={clear} className="rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white">+ New blog</button></div></div>
    {(error || notice) && <div className="mb-5 space-y-2">{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}</div>}
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="h-fit rounded-xl border border-border bg-background p-4 xl:sticky xl:top-6"><div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-lg font-bold text-navy">All blogs</h2><span className="text-xs text-muted-foreground">{filtered.length}/{blogs.length}</span></div><input className={input} placeholder="Search title, slug, tags…" value={query} onChange={e => setQuery(e.target.value)} /><select className={input + ' mt-3'} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option></select>
        {loading ? <p className="py-8 text-sm text-muted-foreground">Loading blogs…</p> : <div className="mt-4 flex flex-col gap-2">{filtered.map(blog => <article key={blog.id} className={'rounded-lg border p-3 ' + (form.id === blog.id ? 'border-brand bg-brand-tint' : 'border-border')}><button type="button" onClick={() => edit(blog)} className="w-full text-left"><span className="block text-sm font-bold text-navy">{blog.title || 'Untitled blog'}</span><span className="mt-1 block break-all font-mono text-[11px] text-muted-foreground">/blog/{blog.slug}</span><span className="mt-2 flex flex-wrap items-center gap-2"><Pill value={blog.status || 'draft'} />{blog.updatedAt && <span className="text-[11px] text-muted-foreground">{new Date(blog.updatedAt).toLocaleDateString()}</span>}</span></button><div className="mt-3 flex flex-wrap gap-3 text-xs font-bold"><button type="button" onClick={() => duplicate(blog)} className="text-brand">Duplicate</button><button type="button" onClick={() => void remove(blog)} className="text-red-600">Delete</button>{blog.status === 'published' && <Link href={'/blog/' + blog.slug} target="_blank" className="text-navy">View ↗</Link>}</div></article>)}{filtered.length === 0 && <p className="py-6 text-sm text-muted-foreground">{blogs.length ? 'No blogs match these filters.' : 'No blog records found. Create your first draft.'}</p>}</div>}
        <button type="button" onClick={() => void load()} className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm font-bold text-navy">Refresh list</button>
      </aside>
      <section className="min-w-0 rounded-xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 md:p-5"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">{form.id ? 'Editing · ' + form.id : 'New record'}</p><h2 className="mt-1 font-serif text-xl font-bold text-navy">{form.title || 'Untitled blog'}</h2><p className="mt-1 text-xs text-muted-foreground">{form.id ? 'Version ' + (blogs.find(item => item.id === form.id)?.version || '—') : 'Not saved yet'} · {form.status}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void save('draft')} className="rounded-md border border-border px-3 py-2 text-sm font-bold text-navy disabled:opacity-50">{saving ? 'Saving…' : 'Save draft'}</button><button type="button" disabled={saving} onClick={() => void save('published')} className="rounded-md bg-brand px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Publish'}</button>{form.status === 'published' && <button type="button" disabled={saving} onClick={() => void save('unpublished')} className="rounded-md border border-border px-3 py-2 text-sm font-bold text-navy">Unpublish</button>}</div></div>
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-3">{tabs.map(item => <button type="button" key={item} onClick={() => { setTab(item); if (item === 'Revisions') void loadRevisions() }} className={'shrink-0 border-b-2 px-3 py-2 text-sm font-bold ' + (tab === item ? 'border-brand text-brand' : 'border-transparent text-muted-foreground hover:text-navy')}>{item}</button>)}</div>
        <div className="p-5 md:p-8">
          {tab === 'Basic' && <div className="grid gap-5 md:grid-cols-2">
            <Field label="Blog title *"><input className={input} required value={form.title} onChange={e => { const title = e.target.value; setForm(current => ({ ...current, title, slug: current.id ? current.slug : title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })) }} /></Field>
            <Field label="Slug *" hint="Lowercase words separated by hyphens."><input className={input} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={e => update('slug', e.target.value)} /><span className="text-xs font-normal text-muted-foreground">/blog/{form.slug || 'your-blog-slug'}</span></Field>
            <Field label="Excerpt / listing summary"><Text value={form.excerpt} onChange={v => update('excerpt', v)} placeholder="Short summary shown in the blog listing" /></Field><Field label="Author"><input className={input} value={form.author} onChange={e => update('author', e.target.value)} /></Field>
            <Field label="Category"><input className={input} value={form.category} onChange={e => update('category', e.target.value)} /></Field><Field label="Tags" hint="Comma-separated"><input className={input} value={form.tags.join(', ')} onChange={e => update('tags', e.target.value.split(',').map(v => v.trim()).filter(Boolean))} /></Field>
            <Field label="Status"><select className={input} value={form.status} onChange={e => update('status', e.target.value as Status)}><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option></select></Field><Field label="Search / preview summary"><Text value={form.summary} onChange={v => update('summary', v)} /></Field>
          </div>}
          {tab === 'Intent' && <div className="grid gap-5 md:grid-cols-2"><Field label="Search intent"><select className={input} value={form.intent.searchIntent} onChange={e => updateIntent('searchIntent', e.target.value)}>{['informational','commercial','transactional','navigational','local'].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Target audience"><input className={input} value={form.intent.targetAudience} onChange={e => updateIntent('targetAudience', e.target.value)} /></Field><Field label="Target location"><input className={input} value={form.intent.targetLocation} onChange={e => updateIntent('targetLocation', e.target.value)} /></Field><Field label="Related topics"><Text value={form.intent.relatedTopics} onChange={v => updateIntent('relatedTopics', v)} /></Field><Field label="Related entities"><Text value={form.intent.relatedEntities} onChange={v => updateIntent('relatedEntities', v)} /></Field></div>}
          {tab === 'SEO' && <div className="grid gap-5 md:grid-cols-2"><Field label="Primary keyword"><input className={input} value={form.seo.primaryKeyword} onChange={e => updateSeo('primaryKeyword', e.target.value)} /></Field><Field label="Secondary keywords"><Text value={form.seo.secondaryKeywords} onChange={v => updateSeo('secondaryKeywords', v)} rows={2} /></Field><Field label="SEO title"><input className={input} value={form.seo.seoTitle} onChange={e => updateSeo('seoTitle', e.target.value)} /><span className="text-xs font-normal text-muted-foreground">{form.seo.seoTitle.length}/60 characters</span></Field><Field label="Meta description"><Text value={form.seo.metaDescription} onChange={v => updateSeo('metaDescription', v)} /><span className="text-xs font-normal text-muted-foreground">{form.seo.metaDescription.length}/160 characters</span></Field><Field label="Canonical URL"><input className={input} value={form.seo.canonicalUrl} onChange={e => updateSeo('canonicalUrl', e.target.value)} placeholder="/blog/slug or absolute URL" /></Field><Field label="Robots"><div className="flex gap-4 pt-2"><label><input type="checkbox" checked={form.seo.robotsIndex} onChange={e => updateSeo('robotsIndex', e.target.checked)} /> Index</label><label><input type="checkbox" checked={form.seo.robotsFollow} onChange={e => updateSeo('robotsFollow', e.target.checked)} /> Follow</label></div></Field><Field label="Open Graph title"><input className={input} value={form.seo.ogTitle} onChange={e => updateSeo('ogTitle', e.target.value)} /></Field><Field label="Open Graph description"><Text value={form.seo.ogDescription} onChange={v => updateSeo('ogDescription', v)} /></Field><Field label="Open Graph image URL"><input className={input} value={form.seo.ogImage} onChange={e => updateSeo('ogImage', e.target.value)} /></Field><Field label="Twitter title"><input className={input} value={form.seo.twitterTitle} onChange={e => updateSeo('twitterTitle', e.target.value)} /></Field><Field label="Twitter description"><Text value={form.seo.twitterDescription} onChange={v => updateSeo('twitterDescription', v)} /></Field><Field label="Twitter image URL"><input className={input} value={form.seo.twitterImage} onChange={e => updateSeo('twitterImage', e.target.value)} /></Field></div>}
          {tab === 'Content' && <div className="flex flex-col gap-5"><Field label="Introduction"><Text value={form.introduction} onChange={v => update('introduction', v)} /></Field><Field label="Main article content" hint="Paragraphs can be separated by blank lines."><Text value={form.body} onChange={v => update('body', v)} rows={12} placeholder="Write the article content here…" /></Field><Field label="Conclusion"><Text value={form.conclusion} onChange={v => update('conclusion', v)} /></Field><div className="border-t border-border pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-navy">Content sections</h3><button type="button" onClick={() => update('sections', [...form.sections, { id: crypto.randomUUID(), title: '', content: '', displayOrder: form.sections.length + 1, status: 'active' }])} className="rounded-md bg-brand px-3 py-2 text-xs font-bold text-white">+ Add section</button></div>{form.sections.map((section, index) => <div key={section.id} className="mb-4 rounded-xl border border-border bg-surface p-4"><div className="mb-3 flex justify-between"><strong className="text-sm text-navy">Section {index + 1}</strong><button type="button" onClick={() => update('sections', form.sections.filter(item => item.id !== section.id))} className="text-xs font-bold text-red-600">Delete</button></div><div className="grid gap-3 md:grid-cols-[1fr_110px_130px]"><input className={input} placeholder="Heading" value={section.title} onChange={e => update('sections', form.sections.map(item => item.id === section.id ? { ...item, title: e.target.value } : item))} /><input className={input} type="number" aria-label="Display order" value={section.displayOrder} onChange={e => update('sections', form.sections.map(item => item.id === section.id ? { ...item, displayOrder: Number(e.target.value) } : item))} /><select className={input} value={section.status} onChange={e => update('sections', form.sections.map(item => item.id === section.id ? { ...item, status: e.target.value as Section['status'] } : item))}><option value="active">Enabled</option><option value="disabled">Disabled</option></select></div><div className="mt-3"><Text value={section.content} onChange={v => update('sections', form.sections.map(item => item.id === section.id ? { ...item, content: v } : item))} rows={5} /></div></div>)}</div></div>}
          {tab === 'Links' && <div><div className="mb-4 flex justify-between"><h3 className="font-serif text-lg font-bold text-navy">Internal and related links</h3><button type="button" onClick={() => update('links', [...form.links, { id: crypto.randomUUID(), anchorText: '', url: '', description: '', displayOrder: form.links.length + 1, status: 'active', openInNewTab: false }])} className="rounded-md bg-brand px-3 py-2 text-xs font-bold text-white">+ Add link</button></div>{form.links.map(item => <div key={item.id} className="mb-3 grid gap-3 rounded-lg border border-border bg-surface p-3 md:grid-cols-[1fr_1fr_1fr_100px_auto]"><input className={input} placeholder="Anchor text" value={item.anchorText} onChange={e => update('links', form.links.map(v => v.id === item.id ? { ...v, anchorText: e.target.value } : v))} /><input className={input} placeholder="/internal-url" value={item.url} onChange={e => update('links', form.links.map(v => v.id === item.id ? { ...v, url: e.target.value } : v))} /><input className={input} placeholder="Description" value={item.description} onChange={e => update('links', form.links.map(v => v.id === item.id ? { ...v, description: e.target.value } : v))} /><select className={input} value={item.status} onChange={e => update('links', form.links.map(v => v.id === item.id ? { ...v, status: e.target.value as RelatedLink['status'] } : v))}><option value="active">Active</option><option value="draft">Draft</option></select><button type="button" onClick={() => update('links', form.links.filter(v => v.id !== item.id))} className="text-xs font-bold text-red-600">Delete</button></div>)}</div>}
          {tab === 'FAQ' && <div><div className="mb-4 flex justify-between"><h3 className="font-serif text-lg font-bold text-navy">Frequently asked questions</h3><button type="button" onClick={() => update('faqs', [...form.faqs, { id: crypto.randomUUID(), question: '', answer: '', displayOrder: form.faqs.length + 1, status: 'active' }])} className="rounded-md bg-brand px-3 py-2 text-xs font-bold text-white">+ Add FAQ</button></div>{form.faqs.map((item, index) => <div key={item.id} className="mb-3 rounded-lg border border-border bg-surface p-4"><div className="mb-3 flex justify-between"><strong className="text-sm text-navy">FAQ {index + 1}</strong><button type="button" onClick={() => update('faqs', form.faqs.filter(v => v.id !== item.id))} className="text-xs font-bold text-red-600">Delete</button></div><input className={input} placeholder="Question" value={item.question} onChange={e => update('faqs', form.faqs.map(v => v.id === item.id ? { ...v, question: e.target.value } : v))} /><div className="mt-3"><Text value={item.answer} onChange={v => update('faqs', form.faqs.map(x => x.id === item.id ? { ...x, answer: v } : x))} /></div><select className={input + ' mt-3'} value={item.status} onChange={e => update('faqs', form.faqs.map(v => v.id === item.id ? { ...v, status: e.target.value as Faq['status'] } : v))}><option value="active">Enabled</option><option value="draft">Draft</option></select></div>)}</div>}
          {tab === 'Media' && <div className="grid gap-5 md:grid-cols-2"><Field label="Featured image URL"><input className={input} value={form.featuredImage.image} onChange={e => updateImage('image', e.target.value)} placeholder="/images/blog-cover.webp or https://…" /></Field><Field label="Alt text"><input className={input} value={form.featuredImage.altText} onChange={e => updateImage('altText', e.target.value)} /></Field><Field label="Image title"><input className={input} value={form.featuredImage.title} onChange={e => updateImage('title', e.target.value)} /></Field><Field label="Caption"><input className={input} value={form.featuredImage.caption} onChange={e => updateImage('caption', e.target.value)} /></Field><Field label="Description"><Text value={form.featuredImage.description} onChange={v => updateImage('description', v)} /></Field>{form.featuredImage.image && <div className="rounded-lg border border-border p-3"><p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Image preview</p><img src={form.featuredImage.image} alt={form.featuredImage.altText} className="max-h-64 w-full rounded-md object-contain" /></div>}</div>}
          {tab === 'Schema' && <div><p className="mb-4 text-sm text-muted-foreground">Schema preferences are stored with the blog SEO metadata. Actual structured-data output depends on the public renderer.</p><div className="grid gap-4 md:grid-cols-2">{Object.entries(form.schema).map(([key, value]) => <Field key={key} label={key}><select className={input} value={value} onChange={e => update('schema', { ...form.schema, [key]: e.target.value })}><option value="auto">Automatic</option><option value="manual">Manual</option><option value="disabled">Disabled</option></select></Field>)}</div></div>}
          {tab === 'Sitemap' && <div className="grid gap-5 md:grid-cols-2"><Field label="Include in sitemap"><select className={input} value={String(form.sitemap.include)} onChange={e => update('sitemap', { ...form.sitemap, include: e.target.value === 'true' })}><option value="true">Yes</option><option value="false">No</option></select></Field><Field label="Priority"><select className={input} value={form.sitemap.priority} onChange={e => update('sitemap', { ...form.sitemap, priority: e.target.value })}>{['1.0','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1'].map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Change frequency"><select className={input} value={form.sitemap.changeFrequency} onChange={e => update('sitemap', { ...form.sitemap, changeFrequency: e.target.value })}>{['always','hourly','daily','weekly','monthly','yearly','never'].map(v => <option key={v}>{v}</option>)}</select></Field></div>}
          {tab === 'Audit' && <div><div className="mb-5 flex flex-wrap items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Internal SEO readiness</p><h3 className="font-serif text-2xl font-bold text-navy">{score}/100</h3></div><p className="max-w-xl text-sm text-muted-foreground">Editorial checklist only, not a Google ranking score or guarantee.</p></div><div className="divide-y divide-border rounded-lg border border-border">{checks.map(item => <div key={item.label} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-navy">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div><Pill value={item.ok ? 'pass' : 'review'} /></div>)}</div></div>}
          {tab === 'Preview' && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"><div><div className="mb-5 rounded-lg border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Search result preview</p><p className="mt-2 text-lg text-blue-800">{form.seo.seoTitle || form.title || 'Blog title'}</p><p className="text-xs text-emerald-800">{form.seo.canonicalUrl || '/blog/' + form.slug}</p><p className="mt-1 text-sm text-muted-foreground">{form.seo.metaDescription || form.excerpt || 'Meta description preview'}</p></div><article className="rounded-xl border border-border bg-background p-6"><p className="eyebrow">{form.category || 'Blog'}</p><h1 className="mt-3 font-serif text-3xl font-bold text-navy">{form.title || 'Your blog title'}</h1>{form.excerpt && <p className="mt-4 text-lg leading-7 text-muted-foreground">{form.excerpt}</p>}{form.featuredImage.image && <img src={form.featuredImage.image} alt={form.featuredImage.altText} className="mt-5 max-h-80 w-full rounded-lg object-cover" />}{form.introduction && <p className="mt-6 whitespace-pre-line leading-8 text-muted-foreground">{form.introduction}</p>}{form.body && <p className="mt-5 whitespace-pre-line leading-8 text-muted-foreground">{form.body}</p>}{form.sections.filter(s => s.status === 'active').sort((a,b) => a.displayOrder-b.displayOrder).map(section => <section key={section.id} className="mt-8"><h2 className="font-serif text-2xl font-bold text-navy">{section.title}</h2><p className="mt-3 whitespace-pre-line leading-8 text-muted-foreground">{section.content}</p></section>)}{form.conclusion && <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-navy">Conclusion</h2><p className="mt-3 whitespace-pre-line leading-8 text-muted-foreground">{form.conclusion}</p></section>}{form.faqs.filter(f => f.status === 'active').length > 0 && <section className="mt-8"><h2 className="font-serif text-2xl font-bold text-navy">FAQs</h2>{form.faqs.filter(f => f.status === 'active').map(f => <div key={f.id} className="mt-4"><h3 className="font-semibold text-navy">{f.question}</h3><p className="mt-1 whitespace-pre-line text-muted-foreground">{f.answer}</p></div>)}</section>}</article></div><aside className="h-fit rounded-lg border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Publish readiness</p><Pill value={form.status} /><p className="mt-3 text-sm text-muted-foreground">{checks.filter(c => c.ok).length} of {checks.length} checks pass.</p><button type="button" onClick={() => void save('draft')} disabled={saving} className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm font-bold text-navy">Save draft</button><button type="button" onClick={() => void save('published')} disabled={saving} className="mt-2 w-full rounded-md bg-brand px-3 py-2 text-sm font-bold text-white">Publish article</button></aside></div>}
          {tab === 'Revisions' && <div><div className="mb-4 flex items-center justify-between"><div><h3 className="font-serif text-lg font-bold text-navy">Revision history</h3><p className="text-xs text-muted-foreground">Restore creates a new draft; it does not overwrite the published version.</p></div><button type="button" disabled={!form.id || revisionLoading} onClick={() => void loadRevisions()} className="rounded-md border border-border px-3 py-2 text-xs font-bold text-navy">Refresh</button></div>{!form.id ? <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">Save the blog first to enable revision history.</p> : revisionLoading ? <p className="py-6 text-sm text-muted-foreground">Loading revisions…</p> : revisions.length === 0 ? <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No revisions found.</p> : <div className="divide-y divide-border rounded-lg border border-border">{revisions.map(rev => <div key={rev.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-navy">Version {rev.version} <span className="ml-2 text-xs font-normal text-muted-foreground">{rev.changeType}</span></p><p className="mt-1 text-xs text-muted-foreground">{new Date(rev.createdAt).toLocaleString()} · {rev.status}</p></div><button type="button" onClick={() => void restore(rev)} className="rounded-md border border-border px-3 py-2 text-xs font-bold text-brand">Restore as draft</button></div>)}</div>}</div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4 text-xs text-muted-foreground"><span>Blogs use separate database records and the authenticated Blog API; service-page records are not changed.</span><span>Unsaved edits remain in this form until saved.</span></div>
      </section>
    </div>
  </div></main>
}
