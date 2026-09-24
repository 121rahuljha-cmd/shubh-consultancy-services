import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'
import { saveDevelopmentPublishedOverride } from '@/lib/dev-published-overrides'
import type { ServiceBuilderRecord } from '@/lib/service-builder'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const body = await request.json().catch(() => null) as ServiceBuilderRecord | null
    const localBypass = process.env.NODE_ENV === 'development' && process.env.ADMIN_DEV_BYPASS === 'true'
    if (!localBypass && !(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    if (!process.env.DATABASE_URL && localBypass) {
      const record = body?.serviceSlug === slug ? body : null
      if (!record) return NextResponse.json({ error: 'Service draft was not found.' }, { status: 404 })
      return NextResponse.json({ record: await saveDevelopmentPublishedOverride(record) })
    }
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed Service Builder.' }, { status: 503 })
    return NextResponse.json({ record: await createProductionRepository().publishService(slug) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Service could not be published.' }, { status: 400 })
  }
}
