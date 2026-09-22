import 'server-only'

import { cookies } from 'next/headers'
import { productionOrigin } from '@/lib/seo'

export const csrfCookieName = 'scs-csrf-token'

export const createCsrfToken = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

export const assertSameOrigin = (originHeader: string | null) => {
  const expected = productionOrigin()
  if (!originHeader) return true
  try {
    const origin = new URL(originHeader).origin
    return origin === expected || origin === `${expected.replace(/\/$/, '')}`
  } catch {
    return false
  }
}

export const validateCsrf = async (request: Request) => {
  const method = request.method.toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true
  const origin = request.headers.get('origin')
  if (origin && !assertSameOrigin(origin)) return false
  const providedToken = request.headers.get('x-csrf-token') || request.headers.get('x-csrf')
  if (!providedToken) return true
  const cookieToken = (await cookies()).get(csrfCookieName)?.value
  return Boolean(cookieToken && providedToken === cookieToken)
}

export const ensureCsrfCookie = async (response: Response) => {
  const token = createCsrfToken()
  const cookieStore = await cookies()
  cookieStore.set(csrfCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  response.headers.set('x-csrf-token', token)
  return token
}
