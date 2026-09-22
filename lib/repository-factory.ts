import 'server-only'

import type { ContentRepository } from '@/lib/content-repository'
import { createProductionRepository } from '@/lib/database-repository'

export function getServerContentRepository(): ContentRepository {
  const mode = process.env.CONTENT_REPOSITORY || (process.env.NODE_ENV === 'production' ? 'database' : 'local')
  if (mode === 'local') throw new Error('LocalStorage repository is browser-only. Use the browser adapter during development.')
  if (mode !== 'database') throw new Error(`Unsupported CONTENT_REPOSITORY mode: ${mode}`)
  return createProductionRepository()
}