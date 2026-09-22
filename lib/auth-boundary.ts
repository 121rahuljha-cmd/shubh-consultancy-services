import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { AdminRole, AdminUserRecord } from '@/lib/cms-model'
import { authCookieName, createSessionToken, readSessionToken } from '@/lib/auth-token'

export type AuthSession = { userId: string; role: AdminRole; expiresAt: string }
export type AuthBoundary = { getSession(): Promise<AuthSession | null>; requireSession(): Promise<AuthSession>; signOut(): Promise<void>; can(session: AuthSession, action: 'view' | 'edit' | 'research' | 'ai' | 'publish' | 'revisions'): boolean }

export async function getServerSession() {
  const token = (await cookies()).get(authCookieName)?.value
  return readSessionToken(token)
}

export function can(session: AuthSession, action: 'view' | 'edit' | 'research' | 'ai' | 'publish' | 'revisions') {
  if (session.role === 'ADMIN') return true
  if (action === 'view') return true
  if (action === 'publish' || action === 'revisions') return session.role === 'EDITOR'
  if (action === 'ai' || action === 'research') return session.role === 'SEO_MANAGER' || session.role === 'EDITOR'
  return session.role === 'EDITOR' || session.role === 'AUTHOR' || session.role === 'SEO_MANAGER'
}

export function createServerAuthBoundary(): AuthBoundary {
  return {
    getSession: getServerSession,
    requireSession: async () => { const session = await getServerSession(); if (!session) redirect('/admin/login'); return session },
    signOut: async () => { (await cookies()).delete(authCookieName) },
    can,
  }
}

export async function findAdminUser(username: string) {
  if (!process.env.DATABASE_URL) return null
  return prisma.adminUser.findUnique({ where: { username } }) as unknown as Promise<AdminUserRecord | null>
}

export type AdminIdentity = Pick<AdminUserRecord, 'id' | 'username' | 'role'>