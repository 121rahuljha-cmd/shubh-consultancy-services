import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'
import type { ServiceBuilderRecord } from '@/lib/service-builder'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed Service Builder.' }, { status: 503 })
  try { return NextResponse.json({ source: 'database', records: await createProductionRepository().getServices() }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Services could not be loaded.' }, { status: 503 }) }
}

export async function POST(request: Request) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed Service Builder.' }, { status: 503 })
  const record = await request.json() as ServiceBuilderRecord
  if (!record?.serviceSlug || !record.serviceName || !record.quickInfo || !record.seo) return NextResponse.json({ error: 'Service Builder record is incomplete.' }, { status: 400 })
  try { return NextResponse.json({ record: await createProductionRepository().createService(record) }, { status: 201 }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Service could not be created.' }, { status: 400 }) }
}
