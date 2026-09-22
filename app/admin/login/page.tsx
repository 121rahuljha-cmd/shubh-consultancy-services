'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try { const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }); const result = await response.json() as { error?: string }; if (!response.ok) throw new Error(result.error || 'Login failed.'); router.replace('/admin'); router.refresh() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Login failed.') } finally { setLoading(false) }
  }
  return <main className="min-h-[70vh] bg-surface px-4 py-20"><form onSubmit={submit} className="mx-auto max-w-md rounded-xl border border-border bg-background p-6"><p className="eyebrow">Admin access</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">Sign in</h1><p className="mt-2 text-sm text-muted-foreground">Admin access requires a configured server database and account.</p><label className="mt-6 flex flex-col gap-2 text-sm font-semibold text-navy">Username<input className="rounded-lg border border-border px-3 py-2.5" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></label><label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-navy">Password<input className="rounded-lg border border-border px-3 py-2.5" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>{error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}<button className="mt-6 w-full rounded-md bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button></form></main>
}
