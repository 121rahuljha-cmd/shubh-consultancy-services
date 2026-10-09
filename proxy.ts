import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readSessionToken } from '@/lib/auth-token'
import { getRedirectForPath } from '@/lib/redirects'

const publicApiRoutes = new Set(['/api/health', '/api/leads'])
// Development-only bypass for local QA. Never honor this flag in production, even if it is accidentally configured.
const adminDevBypass = process.env.NODE_ENV === 'development' && process.env.ADMIN_DEV_BYPASS === 'true'

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const requestOrigin = new URL(request.url).origin
  return origin === requestOrigin
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method.toUpperCase()

  if (pathname === '/admin/login' || pathname === '/api/auth/login' || pathname === '/api/auth/logout') return NextResponse.next()

  const redirect = await getRedirectForPath(pathname)
  if (redirect) {
    return NextResponse.redirect(new URL(redirect.destination, request.url), { status: redirect.statusCode })
  }

  if (pathname.startsWith('/admin')) {
    const session = readSessionToken(request.cookies.get('scs-admin-session')?.value)
    if (!session && !adminDevBypass) return NextResponse.redirect(new URL('/admin/login', request.url))
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !sameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/ai/')) {
    const session = readSessionToken(request.cookies.get('scs-admin-session')?.value)
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !sameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/') && !publicApiRoutes.has(pathname) && request.method !== 'GET') {
    const session = readSessionToken(request.cookies.get('scs-admin-session')?.value)
    const localPublishBypass = adminDevBypass && /^\/api\/services\/[^/]+\/publish$/.test(pathname)
    if (!session && !localPublishBypass) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/api/:path*'] }
