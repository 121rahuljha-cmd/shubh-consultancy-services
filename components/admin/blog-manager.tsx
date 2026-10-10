'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type BlogRecord = {
  id: string
  slug: string
  title: string
  content: unknown
  status?: 'draft' | 'published' | 'unpublished'
  publishedAt?: string | null
  updatedAt?: string | null
}

const inputClass = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground'
const blank = { id: '', title: '', slug: '', content: '', status: 'draft' as const }

export function BlogManager() {
  const [blogs, setBlogs] = useState<BlogRecord[]>([])
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/blogs', { cache: 'no-store' })
      const data = await response.json() as { blogs?: BlogRecord[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'Blogs could not be loaded.')
      setBlogs(data.blogs || [])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Blogs could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const startEdit = (blog: BlogRecord) => {
    setForm({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: typeof blog.content === 'string' ? blog.content : JSON.stringify(blog.content ?? {}, null, 2),
      status: blog.status === 'published' || blog.status === 'unpublished' ? blog.status : 'draft',
    })
    setNotice('')
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    setError('')
    let content: unknown = form.content
    try { content = JSON.parse(form.content) } catch { /* plain-text blog content is supported */ }
    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: form.id || undefined, title: form.title.trim(), slug: form.slug.trim(), content, status: form.status }),
      })
      const data = await response.json() as { blog?: BlogRecord; error?: string }
      if (!response.ok) throw new Error(data.error || 'Blog could not be saved.')
      setNotice('Blog saved. Publishing status follows the saved record.')
      setForm(blank)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Blog could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const updateTitle = (title: string) => setForm((current) => ({
    ...current,
    title,
    slug: current.id ? current.slug : title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  }))

  return <main className="min-h-screen bg-surface">
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Admin / content</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">Blog Management</h1><p className="mt-2 text-sm text-muted-foreground">Blog posts are managed separately from service landing pages.</p></div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">Dashboard</Link>
          <Link href="/blog" target="_blank" className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">View public blog</Link>
          <button type="button" onClick={() => { setForm(blank); setNotice(''); setError('') }} className="rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white">New blog</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-xl font-bold text-navy">Blog posts</h2><span className="text-xs text-muted-foreground">{blogs.length} record(s)</span></div>
          {loading ? <p className="py-8 text-sm text-muted-foreground">Loading blogs…</p> : blogs.length === 0 ? <p className="py-8 text-sm text-muted-foreground">No blog records found. Create a draft using the form.</p> : <div className="mt-4 flex flex-col divide-y divide-border">{blogs.map((blog) => <article key={blog.id} className="py-4 first:pt-0"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-navy">{blog.title}</h3><p className="mt-1 break-all font-mono text-xs text-muted-foreground">/blog/{blog.slug}</p><span className="mt-2 inline-block rounded-full bg-surface px-2 py-1 text-xs font-bold uppercase text-muted-foreground">{blog.status || 'draft'}</span></div><button type="button" onClick={() => startEdit(blog)} className="rounded-md border border-border px-3 py-2 text-xs font-bold text-brand">Edit</button></div><Link href={`/blog/${blog.slug}`} target="_blank" className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">Open article ↗</Link></article>)}</div>}
        </section>

        <section className="rounded-xl border border-border bg-background p-5">
          <h2 className="font-serif text-xl font-bold text-navy">{form.id ? 'Edit blog' : 'Create blog draft'}</h2>
          <form onSubmit={save} className="mt-4 flex flex-col gap-4">
            <label className="text-sm font-semibold text-navy">Title *<input className={`${inputClass} mt-1`} required value={form.title} onChange={(event) => updateTitle(event.target.value)} /></label>
            <label className="text-sm font-semibold text-navy">Slug *<input className={`${inputClass} mt-1`} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} /><span className="mt-1 block text-xs font-normal text-muted-foreground">URL: /blog/{form.slug || 'your-blog-slug'}</span></label>
            <label className="text-sm font-semibold text-navy">Content *<textarea className={`${inputClass} mt-1 min-h-48 resize-y`} required value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Write the article content, or paste a JSON content object." /></label>
            <label className="text-sm font-semibold text-navy">Status<select className={`${inputClass} mt-1`} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as typeof blank.status | 'published' | 'unpublished' }))}><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></label>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
            <div className="flex flex-wrap gap-2"><button disabled={saving} className="rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save blog'}</button><button type="button" onClick={() => { setForm(blank); setNotice(''); setError('') }} className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">Clear</button></div>
          </form>
        </section>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">Note: this editor saves through the existing authenticated Blog API. If the production database is not configured, the page will show the API error instead of pretending the save succeeded.</p>
    </div>
  </main>
}
