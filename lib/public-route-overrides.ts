import 'server-only'

import { prisma } from '@/lib/prisma'

export type PublicRouteKey = 'home' | 'services' | 'contact'

export type PublicRouteOverride = {
  routeKey: PublicRouteKey
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'PENDING_APPROVAL' | 'APPROVED' | 'CHANGES_REQUESTED' | 'ARCHIVED'
  revision: number
  content: {
    title?: string
    description?: string
    seoTitle?: string
    metaDescription?: string
    canonicalUrl?: string
    robotsIndex?: boolean
    robotsFollow?: boolean
  }
  publishedAt: Date | null
  updatedAt: Date
  createdAt: Date
}

export type PublicRouteOverrideInput = Omit<PublicRouteOverride, 'publishedAt' | 'updatedAt' | 'createdAt'> & {
  content: PublicRouteOverride['content']
}

const routeKeys = new Set<PublicRouteKey>(['home', 'services', 'contact'])

export function isPublicRouteKey(value: string): value is PublicRouteKey {
  return routeKeys.has(value as PublicRouteKey)
}

export async function getPublishedPublicRouteOverride(routeKey: PublicRouteKey): Promise<PublicRouteOverride | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const row = await prisma.publicRouteOverride.findUnique({
      where: { routeKey },
    })
    return row?.status === 'PUBLISHED' ? { ...row, routeKey: row.routeKey as PublicRouteKey, content: row.content as PublicRouteOverride['content'], publishedAt: row.publishedAt, updatedAt: row.updatedAt, createdAt: row.createdAt } : null
  } catch {
    return null
  }
}

export async function listPublicRouteOverrides(): Promise<PublicRouteOverride[]> {
  if (!process.env.DATABASE_URL) return []
  return prisma.publicRouteOverride.findMany({ orderBy: { updatedAt: 'desc' } }) as unknown as Promise<PublicRouteOverride[]>
}

export async function savePublicRouteOverride(input: PublicRouteOverrideInput): Promise<PublicRouteOverride> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for route overrides.')
  if (!isPublicRouteKey(input.routeKey)) throw new Error('Only home, services and contact route overrides are supported.')
  const current = await prisma.publicRouteOverride.findUnique({ where: { routeKey: input.routeKey } })
  const revision = (current?.revision || 0) + 1
  if (current) {
    return prisma.publicRouteOverride.update({
      where: { routeKey: input.routeKey },
      data: { status: input.status, revision, content: input.content },
    }) as unknown as Promise<PublicRouteOverride>
  }
  return prisma.publicRouteOverride.create({
    data: {
      routeKey: input.routeKey,
      status: input.status,
      revision,
      content: input.content,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
    },
  }) as unknown as Promise<PublicRouteOverride>
}

export async function publishPublicRouteOverride(routeKey: PublicRouteKey): Promise<PublicRouteOverride> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for route overrides.')
  return prisma.publicRouteOverride.update({
    where: { routeKey },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  }) as unknown as Promise<PublicRouteOverride>
}
