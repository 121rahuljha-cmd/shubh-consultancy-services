'use client'

import { useEffect, useState } from 'react'

import type { ClientRecord } from '@/lib/clients'

const emptyClient = { name: '', logo: '', logoAlt: '', description: '', websiteUrl: '', enabled: true }
const input = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm'

export function ClientsManager() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [draft, setDraft] = useState(emptyClient)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const response = await fetch('/api/clients')
    const result = await response.json() as { clients?: ClientRecord[]; error?: string }
    if (!response.ok) throw new Error(result.error || 'Clients could not be loaded.')
    setClients(result.clients || [])
  }

  useEffect(() => {
    load().catch((error) => setNotice(error instanceof Error ? error.message : 'Clients could not be loaded.')).finally(() => setLoading(false))
  }, [])

  const reset = () => { setDraft(emptyClient); setEditingId(null) }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.logo.trim()) { setNotice('Client name and logo URL are required.'); return }
    if (draft.websiteUrl && !draft.websiteUrl.startsWith('https://')) { setNotice('Website URL must use HTTPS.'); return }
    if (editingId) {
      setClients((current) => current.map((client) => client.id === editingId ? { ...client, ...draft, updatedAt: new Date().toISOString() } : client))
    } else {
      const now = new Date().toISOString()
      setClients((current) => [...current, { ...draft, id: crypto.randomUUID(), sortOrder: current.length, createdAt: now, updatedAt: now }])
    }
    reset()
    setNotice('Unsaved changes.')
  }

  const edit = (client: ClientRecord) => { setEditingId(client.id); setDraft({ name: client.name, logo: client.logo, logoAlt: client.logoAlt, description: client.description, websiteUrl: client.websiteUrl, enabled: client.enabled }); setNotice('') }
  const remove = (id: string) => { setClients((current) => current.filter((client) => client.id !== id).map((client, index) => ({ ...client, sortOrder: index }))); setNotice('Unsaved changes.') }
  const move = (index: number, direction: -1 | 1) => setClients((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next.map((client, itemIndex) => ({ ...client, sortOrder: itemIndex })) })

  const save = async () => {
    setNotice('')
    const response = await fetch('/api/clients', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clients }) })
    const result = await response.json() as { clients?: ClientRecord[]; error?: string }
    if (!response.ok) { setNotice(result.error || 'Clients could not be saved.'); return }
    setClients(result.clients || [])
    setNotice('Saved successfully.')
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">Admin / clients</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">Client portfolio</h1><p className="mt-2 text-sm text-muted-foreground">Manage verified client content shown publicly. Media storage is not configured, so provide a secure media URL from the future storage layer.</p></div>
          <button type="button" onClick={save} className="rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white">Save changes</button>
        </div>
        {notice ? <p className="mb-5 rounded-md border border-border bg-background px-3 py-2 text-sm text-navy">{notice}</p> : null}
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={submit} className="rounded-xl border border-border bg-background p-5">
            <h2 className="font-serif text-xl font-bold text-navy">{editingId ? 'Edit client' : 'Add client'}</h2>
            <div className="mt-4 grid gap-3">
              <label className="text-sm font-medium text-navy">Client name<input className={input} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label className="text-sm font-medium text-navy">Logo URL<input className={input} placeholder="https://... or /media/..." value={draft.logo} onChange={(event) => setDraft({ ...draft, logo: event.target.value })} /></label>
              <label className="text-sm font-medium text-navy">Logo alt text<input className={input} value={draft.logoAlt} onChange={(event) => setDraft({ ...draft, logoAlt: event.target.value })} /></label>
              <label className="text-sm font-medium text-navy">Description<textarea className={input} rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
              <label className="text-sm font-medium text-navy">Website URL (optional)<input className={input} placeholder="https://..." value={draft.websiteUrl} onChange={(event) => setDraft({ ...draft, websiteUrl: event.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm font-medium text-navy"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} /> Enabled</label>
              <div className="flex gap-2"><button type="submit" className="rounded-md bg-navy px-3 py-2 text-sm font-bold text-white">{editingId ? 'Update client' : 'Add client'}</button>{editingId ? <button type="button" onClick={reset} className="rounded-md border border-border px-3 py-2 text-sm font-bold text-navy">Cancel</button> : null}</div>
            </div>
          </form>
          <section className="rounded-xl border border-border bg-background p-5"><div className="flex items-center justify-between"><h2 className="font-serif text-xl font-bold text-navy">Clients</h2><span className="text-sm text-muted-foreground">{clients.length} total</span></div>{loading ? <p className="mt-5 text-sm text-muted-foreground">Loading clients...</p> : clients.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">No client records yet.</p> : <ul className="mt-5 grid gap-3">{clients.map((client, index) => <li key={client.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"><img src={client.logo} alt={client.logoAlt} className="size-12 rounded object-contain" /><div className="min-w-0 flex-1"><p className="font-semibold text-navy">{client.name}</p><p className="text-xs text-muted-foreground">{client.enabled ? 'Enabled' : 'Disabled'}{client.websiteUrl ? ` · ${client.websiteUrl}` : ''}</p></div><button type="button" onClick={() => setClients((current) => current.map((item) => item.id === client.id ? { ...item, enabled: !item.enabled } : item))} className="text-xs font-bold text-navy">{client.enabled ? 'Disable' : 'Enable'}</button><button type="button" onClick={() => move(index, -1)} className="text-xs font-bold text-navy">Up</button><button type="button" onClick={() => move(index, 1)} className="text-xs font-bold text-navy">Down</button><button type="button" onClick={() => edit(client)} className="text-xs font-bold text-brand">Edit</button><button type="button" onClick={() => remove(client.id)} className="text-xs font-bold text-red-600">Delete</button></li>)}</ul>}</section>
        </div>
      </div>
    </main>
  )
}
