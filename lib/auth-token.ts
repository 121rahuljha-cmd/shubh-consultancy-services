import { createHmac, timingSafeEqual } from 'node:crypto'

export type SessionToken = { userId: string; role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'SEO_MANAGER'; expiresAt: string }
export const authCookieName = 'scs-admin-session'
const sessionLifetimeSeconds = 60 * 60 * 8
const secret = () => process.env.AUTH_SECRET || ''
const encode = (value: string) => Buffer.from(value).toString('base64url')
const decode = (value: string) => Buffer.from(value, 'base64url').toString('utf8')
const signature = (value: string) => createHmac('sha256', secret()).update(value).digest('base64url')

export function createSessionToken(session: Omit<SessionToken, 'expiresAt'>) {
  if (!secret()) throw new Error('AUTH_SECRET is required before admin sessions can be created.')
  const payload = encode(JSON.stringify({ ...session, expiresAt: new Date(Date.now() + sessionLifetimeSeconds * 1000).toISOString() }))
  return `${payload}.${signature(payload)}`
}

export function readSessionToken(token: string | undefined): SessionToken | null {
  if (!token || !secret()) return null
  const [payload, supplied] = token.split('.')
  if (!payload || !supplied) return null
  const expected = signature(payload)
  if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null
  try { const session = JSON.parse(decode(payload)) as SessionToken; return session.expiresAt > new Date().toISOString() ? session : null } catch { return null }
}
