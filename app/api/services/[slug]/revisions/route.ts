import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed revisions.' }, { status: 503 })
  try {
    const { slug } = await params
    return NextResponse.json({ revisions: await createProductionRepository().listServiceRevisions(slug) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Revisions could not be loaded.' }, { status: 400 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed revisions.' }, { status: 503 })
  try {
    const body = await request.json() as { revisionId?: unknown }
    if (typeof body.revisionId !== 'string' || !body.revisionId) return NextResponse.json({ error: 'Revision id is required.' }, { status: 400 })
    const { slug } = await params
    return NextResponse.json({ record: await createProductionRepository().restoreServiceRevision(slug, body.revisionId) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Revision could not be restored.' }, { status: 400 })
  }
}
