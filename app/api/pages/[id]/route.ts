import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'
import type { CmsPage } from '@/lib/page-cms'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed CMS pages.' }, { status: 503 })
  const { id } = await params
  try { const page = await createProductionRepository().getCmsPage(id); return page ? NextResponse.json({ page }) : NextResponse.json({ error: 'Page not found.' }, { status: 404 }) } catch { return NextResponse.json({ error: 'Page could not be loaded.' }, { status: 503 }) }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed CMS pages.' }, { status: 503 })
  const { id } = await params; const page = await request.json() as CmsPage
  if (page.id !== id || !page.slug || !page.title || !page.serviceId) return NextResponse.json({ error: 'Page identity, title, slug and service are required.' }, { status: 400 })
  try { const repository = createProductionRepository(); const saved = await repository.saveCmsPage(page); return NextResponse.json({ page: saved }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Page could not be updated.' }, { status: 400 }) }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed CMS pages.' }, { status: 503 })
  try { const { id } = await params; return NextResponse.json({ page: await createProductionRepository().archiveCmsPage(id) }) } catch { return NextResponse.json({ error: 'Page could not be archived.' }, { status: 400 }) }
}
