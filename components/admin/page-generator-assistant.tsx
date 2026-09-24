'use client'

import { useState } from 'react'
import { getPages, savePages, type CmsPage } from '@/lib/page-cms'

export function PageGeneratorAssistant() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Ready to generate the first 100 source pages as drafts.')
  const [count, setCount] = useState(0)
  const [pages, setPages] = useState<CmsPage[]>([])

  const handleGenerate = async () => {
    setLoading(true)
    setMessage('Reading all.csv and generating draft pages for Batch 1...')

    try {
      const response = await fetch('/api/admin/page-generator', { method: 'POST' })
      const payload = await response.json()

      if (!response.ok || !payload.pages) {
        throw new Error(payload?.error || 'Generation failed')
      }

      const nextPages = payload.pages as CmsPage[]
      const existing = getPages()
      savePages([...existing, ...nextPages])
      setPages(nextPages)
      setCount(nextPages.length)
      setMessage(`Generated ${nextPages.length} draft pages from the first 100 source rows. They remain unpublished and noindex.`)
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unknown error'
      setMessage(`Generation failed: ${text}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Source-driven page creation</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-navy">Page generator</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            This workflow reads only the first 100 rows from all.csv and creates equivalent Shubh draft pages without publishing, indexing, or altering the original source file.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Generating…' : 'Generate Batch 1 drafts'}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
          <p className="mt-3 text-sm text-navy">{message}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Draft count</p>
          <p className="mt-3 text-3xl font-serif font-bold text-navy">{count}</p>
        </div>
      </div>

      {pages.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-3">Title</th>
                <th className="px-3 py-3">Slug</th>
                <th className="px-3 py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {pages.slice(0, 10).map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 font-semibold text-navy">{item.title}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">/{item.slug}</td>
                  <td className="px-3 py-3 capitalize text-muted-foreground">{item.pageType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
