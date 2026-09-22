import { NextResponse } from 'next/server'
import { scryptSync, timingSafeEqual } from 'node:crypto'
import { findAdminUser } from '@/lib/auth-boundary'
import { authCookieName, createSessionToken } from '@/lib/auth-token'

export const dynamic = 'force-dynamic'

function validPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  try { const expected = Buffer.from(hash, 'hex'); const actual = scryptSync(password, salt, expected.length); return expected.length === actual.length && timingSafeEqual(expected, actual) } catch { return false }
}

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }) }
  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!username || !password) return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
  const user = await findAdminUser(username)
  if (!user || !validPassword(password, user.passwordHash)) return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 })
  try {
    const response = NextResponse.json({ ok: true })
    response.cookies.set(authCookieName, createSessionToken({ userId: user.id, role: user.role }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 8 })
    return response
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Admin session could not be created.' }, { status: 503 }) }
}
