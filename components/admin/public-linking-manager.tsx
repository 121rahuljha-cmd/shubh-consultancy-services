'use client'

import { useEffect, useMemo, useState } from 'react'

import type { PublicLink } from '@/lib/public-linking'

const input = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm'

type Page = PublicLink & { pageType: string }
type Sets = { relatedServices: Page[]; popularSearches: Page[] }

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_/.-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function matchesQuery(page: Page, query: string) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return true
  const haystack = [
    page.title,
    page.slug,
    page.service,
    page.serviceName,
    page.category,
    page.pageType,
    page.state,
    page.city,
    page.url,
  ]
    .filter(Boolean)
    .join(' ')
  return normalize(haystack).includes(normalizedQuery)
}

export function PublicLinkingManager() {
  const [pages, setPages] = useState<Page[]>([])
  const [sets, setSets] = useState<Sets>({ relatedServices: [], popularSearches: [] })
  const [pageId, setPageId] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const selected = pages.find((page) => page.id === pageId)

  useEffect(() => {
    fetch('/api/public-linking')
      .then(async (response) => {
        const result = (await response.json()) as { pages?: Page[]; error?: string }
        if (!response.ok) {
          throw new Error(result.error || 'Links are unavailable.')
        }
        setPages(result.pages || [])
        setPageId(result.pages?.[0]?.id || '')
      })
      .catch((error) => {
        setNotice(error instanceof Error ? error.message : 'Links are unavailable.')
      })
  }, [])

  useEffect(() => {
    if (!pageId) return
    fetch(`/api/public-linking/${encodeURIComponent(pageId)}`)
      .then(async (response) => {
        const result = (await response.json()) as { sets?: Sets; error?: string }
        if (!response.ok) {
          throw new Error(result.error || 'Links could not be loaded.')
        }
        setSets(result.sets || { relatedServices: [], popularSearches: [] })
      })
      .catch((error) => {
        setNotice(error instanceof Error ? error.message : 'Links could not be loaded.')
      })
  }, [pageId])

  const available = useMemo(() => {
    const usedIds = new Set([...sets.relatedServices, ...sets.popularSearches].map((item) => item.id))
    return pages.filter((page) => !usedIds.has(page.id) && matchesQuery(page, query))
  }, [pages, query, sets])

  const add = (bucket: keyof Sets, page: Page) => {
    setSets((current) => ({
      ...current,
      [bucket]: [...current[bucket], page],
    }))
  }

  const remove = (bucket: keyof Sets, id: string) => {
    setSets((current) => ({
      ...current,
      [bucket]: current[bucket].filter((item) => item.id !== id),
    }))
  }

  const move = (bucket: keyof Sets, index: number, direction: -1 | 1) => {
    setSets((current) => {
      const next = [...current[bucket]]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...current, [bucket]: next }
    })
  }

  const dedupe = (bucket: keyof Sets) => {
    setSets((current) => ({
      ...current,
      [bucket]: current[bucket].filter(
        (item, index, source) => source.findIndex((candidate) => candidate.id === item.id) === index,
      ),
    }))
  }

  const save = async () => {
    if (!pageId) return
    setSaving(true)
    setNotice('')
    try {
      const response = await fetch('/api/public-linking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, sets }),
      })
      const result = (await response.json()) as { sets?: Sets; error?: string }
      if (!response.ok) throw new Error(result.error || 'Could not save links.')
      setSets(result.sets || sets)
      setNotice('Saved successfully.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save links.')
    } finally {
      setSaving(false)
    }
  }

  const bucketMeta = (title: string, items: Page[]) => (
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-serif text-xl font-bold text-navy">{title}</h2>
      <span className="text-xs text-muted-foreground">{items.length} saved</span>
    </div>
  )

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin / public linking</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-navy">Service and blog links</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Manage related services and popular searches for each published public page.
            </p>
          </div>
          {selected ? (
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              Editing <span className="font-semibold text-navy">{selected.title}</span>
            </div>
          ) : null}
        </div>

        {notice ? (
          <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {notice}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 lg:grid-cols-[260px_1fr]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-navy">Current public page</span>
            <select
              className={input}
              value={pageId}
              onChange={(event) => setPageId(event.target.value)}
            >
              {pages.length === 0 ? <option value="">Loading pages...</option> : null}
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-navy">Search public pages</span>
            <input
              className={input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, slug, service, state, city, category or URL"
            />
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {(['relatedServices', 'popularSearches'] as const).map((bucket) => (
            <section key={bucket} className="rounded-xl border border-border bg-card p-5">
              {bucketMeta(bucket === 'relatedServices' ? 'Related Services' : 'Popular Searches', sets[bucket])}

              <div className="mt-4 space-y-3">
                {sets[bucket].length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                    No saved {bucket === 'relatedServices' ? 'related services' : 'popular searches'} yet.
                  </p>
                ) : (
                  sets[bucket].map((item, index) => (
                    <div key={`${bucket}-${item.id}`} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-navy">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.url}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {item.pageType}
                            {item.service ? ` · ${item.service}` : ''}
                            {item.state ? ` · ${item.state}` : ''}
                            {item.city ? ` · ${item.city}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(bucket, item.id)}
                          className="text-xs font-bold text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => move(bucket, index, -1)}
                          className="rounded-md border border-border px-2 py-1 text-[11px] font-bold text-navy"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => move(bucket, index, 1)}
                          className="rounded-md border border-border px-2 py-1 text-[11px] font-bold text-navy"
                        >
                          Down
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => dedupe(bucket)}
                  className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-navy"
                >
                  Clear duplicates
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {available.slice(0, 20).map((page) => (
                  <button
                    key={`${bucket}-${page.id}`}
                    type="button"
                    onClick={() => add(bucket, page)}
                    className="w-full rounded-md border border-dashed border-border p-3 text-left transition-colors hover:border-brand hover:bg-brand-tint"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy">{page.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{page.url}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {page.pageType}
                          {page.service ? ` · ${page.service}` : ''}
                          {page.state ? ` · ${page.state}` : ''}
                          {page.city ? ` · ${page.city}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-brand-tint px-2 py-1 text-[10px] font-bold uppercase text-brand">
                        Add
                      </span>
                    </div>
                  </button>
                ))}
                {available.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No available matches in the public registry for this query.
                  </p>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving || !pageId}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </main>
  )
}
