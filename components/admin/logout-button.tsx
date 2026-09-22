'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/admin/login'); router.refresh() }
  return <button type="button" onClick={logout} className="fixed right-4 top-4 z-[60] rounded-md border border-border bg-background px-3 py-2 text-xs font-bold text-navy shadow-sm">Log out</button>
}
