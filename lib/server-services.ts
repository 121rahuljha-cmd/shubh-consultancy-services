import 'server-only'

import { getServiceBuilderRecord as getStaticServiceBuilderRecord, type ServiceBuilderRecord } from '@/lib/service-builder'
import { createProductionRepository } from '@/lib/database-repository'
import { getDevelopmentPublishedOverride } from '@/lib/dev-published-overrides'

export type ServerServiceResult = { record: ServiceBuilderRecord | null; source: 'database' | 'development-fallback' | 'unavailable'; error?: string }

export async function getServerServiceBuilderRecord(slug: string): Promise<ServerServiceResult> {
  if (process.env.DATABASE_URL) {
    try {
      const record = await createProductionRepository().getService(slug)
      if (!record || record.status !== 'published' || record.visibility === 'hidden') return { record: null, source: 'database' }
      return { record, source: 'database' }
    } catch (error) {
      return { record: null, source: 'unavailable', error: error instanceof Error ? error.message : 'Database service lookup failed.' }
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    const override = await getDevelopmentPublishedOverride(slug)
    if (override) return { record: { ...override, hero: { ...override.hero, description: override.shortDescription || override.hero.description } }, source: 'development-fallback' }
    return { record: getStaticServiceBuilderRecord(slug) || null, source: 'development-fallback' }
  }
  return { record: null, source: 'unavailable', error: 'DATABASE_URL is required for production service pages.' }
}
