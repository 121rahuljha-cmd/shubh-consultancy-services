import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'
import type { ServiceBuilderRecord } from '@/lib/service-builder'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed Service Builder.' }, { status: 503 })
  const record = await request.json() as ServiceBuilderRecord
  const { slug } = await params
  if (!record?.serviceSlug || record.serviceSlug !== slug) return NextResponse.json({ error: 'Service slug does not match the record.' }, { status: 400 })
  try { return NextResponse.json({ record: await createProductionRepository().updateService(record) }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Service could not be updated.' }, { status: 400 }) }
}
