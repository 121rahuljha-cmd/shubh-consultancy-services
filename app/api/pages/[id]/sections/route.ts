import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'
import type { CmsSection } from '@/lib/cms-sections'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed CMS sections.' }, { status: 503 })
  try { return NextResponse.json({ sections: await createProductionRepository().listSections((await params).id) }) } catch { return NextResponse.json({ error: 'Sections could not be loaded.' }, { status: 503 }) }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed CMS sections.' }, { status: 503 })
  const sections = await request.json() as CmsSection[]
  if (!Array.isArray(sections)) return NextResponse.json({ error: 'Sections must be an array.' }, { status: 400 })
  try { return NextResponse.json({ sections: await createProductionRepository().saveSectionsDb((await params).id, sections) }) } catch { return NextResponse.json({ error: 'Sections could not be saved.' }, { status: 400 }) }
}
