'use client'

import { useEffect, useState } from 'react'

type RouteKey = 'home' | 'services' | 'contact'
type Override = {
  routeKey: RouteKey
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'
  revision: number
  content: Record<string, unknown>
}

const routeLabels: Record<RouteKey, string> = { home: 'Homepage', services: 'Services index', contact: 'Contact page' }

export function PublicRouteOverridesManager() {
  const [overrides, setOverrides] = useState<Override[]>([])
  const [selected, setSelected] = useState<RouteKey>('home')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<Override['status']>('DRAFT')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/public-route-overrides')
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Route overrides are unavailable.')
        setOverrides(result.overrides || [])
        const current = result.overrides?.find((item: Override) => item.routeKey === selected)
        if (current) { setContent(JSON.stringify(current.content, null, 2)); setStatus(current.status) }
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : 'Could not load route overrides.'))
  }, [])

  const load = (routeKey: RouteKey) => {
    setSelected(routeKey)
    const current = overrides.find((item) => item.routeKey === routeKey)
    if (current) { setContent(JSON.stringify(current.content, null, 2)); setStatus(current.status) }
  }

  const save = async () => {
    try {
      const parsed = JSON.parse(content)
      if (!parsed || typeof parsed !== 'object') throw new Error('Content must be a JSON object.')
      setSaving(true)
      setNotice('')
      const response = await fetch('/api/public-route-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeKey: selected, status, revision: 1, content: parsed }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save route override.')
      setOverrides((current) => [result.override, ...current.filter((item) => item.routeKey !== selected)])
      setNotice(`${routeLabels[selected]} saved as ${status.toLowerCase()}. Drafts are not public.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save route override.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Admin / route CMS</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-navy">Public page overrides</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Edit only approved route metadata, then publish it explicitly. Existing page templates, forms, URLs and generated content remain unchanged.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-xl border border-border bg-background p-3">
            {(Object.keys(routeLabels) as RouteKey[]).map((routeKey) => (
              <button key={routeKey} type="button" onClick={() => load(routeKey)} className={`mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-brand-tint ${selected === routeKey ? 'bg-brand-tint text-brand' : 'text-navy'}`}>
                {routeLabels[routeKey]}
              </button>
            ))}
          </aside>
          <section className="rounded-xl border border-border bg-background p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-xl font-bold text-navy">{routeLabels[selected]}</h2>
              <select value={status} onChange={(event) => setStatus(event.target.value as Override['status'])} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="DRAFT">Draft</option>
                <option value="UNPUBLISHED">Unpublished</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            {notice ? <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{notice}</p> : null}
            <label className="mt-5 flex flex-col gap-2 text-sm font-semibold text-navy">
              Override JSON
              <textarea className="min-h-72 w-full rounded-lg border border-border bg-card p-3 font-mono text-xs outline-none focus:border-brand" value={content} onChange={(event) => setContent(event.target.value)} />
            </label>
            <button type="button" disabled={saving} onClick={save} className="mt-4 rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save override'}</button>
          </section>
        </div>
      </div>
    </main>
  )
}
