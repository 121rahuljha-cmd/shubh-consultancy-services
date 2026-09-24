import 'server-only'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ServiceBuilderRecord } from '@/lib/service-builder'

const overrideFile = path.join(process.cwd(), '.local', 'published-service-overrides.json')

type OverrideStore = Record<string, ServiceBuilderRecord>

function assertDevelopment() {
  if (process.env.NODE_ENV !== 'development') throw new Error('Development override storage is unavailable outside development.')
}

async function readStore(): Promise<OverrideStore> {
  assertDevelopment()
  try { return JSON.parse(await readFile(overrideFile, 'utf8')) as OverrideStore } catch { return {} }
}

export async function getDevelopmentPublishedOverride(slug: string) {
  if (process.env.NODE_ENV !== 'development') return null
  const store = await readStore()
  return store[slug] || null
}

export async function saveDevelopmentPublishedOverride(record: ServiceBuilderRecord) {
  assertDevelopment()
  const store = await readStore()
  store[record.serviceSlug] = { ...record, status: 'published' }
  await mkdir(path.dirname(overrideFile), { recursive: true })
  await writeFile(overrideFile, JSON.stringify(store, null, 2), 'utf8')
  return store[record.serviceSlug]
}
