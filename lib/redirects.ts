import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const normalizeRedirectPath = (value: string) => {
  if (!value) return null
  const path = value.trim()
  if (!path.startsWith('/')) return null
  const safe = path.replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  if (safe.startsWith('//') || safe.includes('://')) return null
  return safe
}

export const getRedirectForPath = async (pathname: string) => {
  if (!process.env.DATABASE_URL) return null
  const normalized = normalizeRedirectPath(pathname)
  if (!normalized) return null
  let current = normalized
  const seen = new Set<string>()
  for (let index = 0; index < 6; index += 1) {
    if (seen.has(current)) return null
    seen.add(current)
    const match = await prisma.redirectRule.findFirst({
      where: { oldPath: current, active: true },
      orderBy: { updatedAt: 'desc' },
    })
    if (!match) return null
    if (match.newPath === match.oldPath) return null
    const next = normalizeRedirectPath(match.newPath)
    if (!next || next === current) return null
    if (next === '/' || next.startsWith('/')) {
      return { destination: next, statusCode: [301, 308].includes(match.statusCode) ? match.statusCode : 301 }
    }
    current = next
  }
  return null
}

export const resolveRedirectResponse = async (request: NextRequest) => {
  const pathname = normalizeRedirectPath(request.nextUrl.pathname)
  if (!pathname) return null
  const redirect = await getRedirectForPath(pathname)
  if (!redirect) return null
  const destination = new URL(redirect.destination, request.url)
  const response = NextResponse.redirect(destination, { status: redirect.statusCode })
  return response
}
