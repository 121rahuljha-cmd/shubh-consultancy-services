import { createBuilderRecord, type ServiceBuilderRecord } from '@/lib/service-builder'
import { services } from '@/lib/site-data'
import type { MigrationReport } from '@/lib/cms-model'

export type MigrationInput = { existing: ServiceBuilderRecord[]; dryRun?: boolean }

export function planContentMigration({ existing, dryRun = true }: MigrationInput): { records: ServiceBuilderRecord[]; report: MigrationReport } {
  const records = [...existing]
  const known = new Set(existing.map((record) => record.serviceSlug))
  const issues: MigrationReport['issues'] = []
  let imported = 0; let skipped = 0; let conflicts = 0; let errors = 0
  for (const service of services) {
    if (known.has(service.slug)) { skipped += 1; continue }
    try {
      const record = createBuilderRecord(service.slug)
      if (records.some((item) => item.slug === record.slug || item.id === record.id)) { conflicts += 1; issues.push({ slug: service.slug, reason: 'A record has the same id or page slug.' }); continue }
      imported += 1
      if (!dryRun) records.push(record)
      known.add(service.slug)
    } catch (error) { errors += 1; issues.push({ slug: service.slug, reason: error instanceof Error ? error.message : 'Unknown migration error' }) }
  }
  return { records, report: { dryRun, imported, skipped, conflicts, errors, issues } }
}

export function exportContentBackup(records: ServiceBuilderRecord[]) { return JSON.stringify({ exportedAt: new Date().toISOString(), source: 'localStorage/site-data', records }, null, 2) }