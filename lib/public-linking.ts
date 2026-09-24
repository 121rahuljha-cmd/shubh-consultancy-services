import 'server-only'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { eligiblePublicPages, type PublicPageDescriptor } from '@/lib/public-page-registry'
import { prisma } from '@/lib/prisma'

export type PublicLink = {
  id: string
  pageId: string
  slug: string
  title: string
  url: string
  pageType: PublicPageDescriptor['pageType']
  service: string
  serviceId?: string
  serviceName?: string
  category?: string
  state: string
  city: string
  status: PublicPageDescriptor['status']
  indexability: PublicPageDescriptor['indexability']
}

export type PublicLinkSets = { relatedServices: PublicLink[]; popularSearches: PublicLink[] }

const defaultSets: PublicLinkSets = { relatedServices: [], popularSearches: [] }
const file = path.join(process.cwd(), '.local', 'public-linking.json')
const keyFor = (pageId: string) => `public-links.${pageId.replace(/[^a-z0-9_-]/gi, '-')}`

const toPublicLink = (page: PublicPageDescriptor): PublicLink => ({
  id: page.id,
  pageId: page.pageId || page.id,
  slug: page.slug,
  title: page.title,
  url: page.url,
  pageType: page.pageType,
  service: page.service,
  serviceId: page.serviceId,
  serviceName: page.serviceName ?? page.service,
  category: page.category ?? '',
  state: page.state,
  city: page.city,
  status: page.status,
  indexability: page.indexability,
})

const clean = (value: unknown): PublicLink[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is PublicLink =>
          Boolean(item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string'),
      )
    : []

async function sanitize(value: unknown): Promise<PublicLinkSets> {
  const allowed = new Map((await eligiblePublicPages()).map((item) => [item.id, item]))
  const sets = value && typeof value === 'object' ? (value as Partial<PublicLinkSets>) : {}

  const resolve = (items: unknown): PublicLink[] =>
    clean(items)
      .map((item) => allowed.get(item.id) ?? null)
      .filter((item): item is PublicPageDescriptor => Boolean(item))
      .map((item) => toPublicLink(item))

  return {
    relatedServices: resolve(sets.relatedServices),
    popularSearches: resolve(sets.popularSearches),
  }
}

async function readDev(): Promise<Record<string, PublicLinkSets>> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as Record<string, PublicLinkSets>
  } catch {
    return {}
  }
}

export async function publicLinkIndex() {
  return (await eligiblePublicPages()).map((page) => toPublicLink(page))
}

export async function getPublicLinkSets(pageId: string): Promise<PublicLinkSets> {
  if (process.env.DATABASE_URL) {
    const setting = await prisma.globalSetting.findUnique({ where: { key: keyFor(pageId) } })
    return sanitize(setting?.value || defaultSets)
  }

  if (process.env.NODE_ENV === 'development') {
    const devStore = await readDev()
    return sanitize(devStore[pageId] || defaultSets)
  }

  return defaultSets
}

export async function savePublicLinkSets(pageId: string, sets: PublicLinkSets) {
  const value = await sanitize(sets)

  if (process.env.DATABASE_URL) {
    return prisma.globalSetting.upsert({
      where: { key: keyFor(pageId) },
      create: { key: keyFor(pageId), value: value as never },
      update: { value: value as never },
    })
  }

  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Server persistence is required outside development.')
  }

  const store = await readDev()
  store[pageId] = value
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(store, null, 2), 'utf8')
  return value
}
