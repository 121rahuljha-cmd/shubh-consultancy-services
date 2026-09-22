import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'
import type { CmsPage } from '@/lib/page-cms'

export const dynamic = 'force-dynamic'
const auth = async () => Boolean(await getServerSession())
const unavailable = () => NextResponse.json({ error: 'DATABASE_URL is required for database-backed CMS pages.' }, { status: 503 })

export async function GET(request: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return unavailable()
  const url = new URL(request.url)
  try { return NextResponse.json({ source: 'database', pages: await createProductionRepository().listCmsPages({ status: url.searchParams.get('status') || undefined, search: url.searchParams.get('search') || undefined }) }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Pages could not be loaded.' }, { status: 503 }) }
}

export async function POST(request: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return unavailable()
  const page = await request.json() as CmsPage
  if (!page?.id || !page.slug || !page.title || !page.serviceId) return NextResponse.json({ error: 'Page id, title, slug and service are required.' }, { status: 400 })
  try { const repository = createProductionRepository(); const saved = await repository.saveCmsPage(page); await repository.savePageRevisionDb(saved, [], 'EDIT'); return NextResponse.json({ page: saved }, { status: 201 }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Page could not be saved.' }, { status: 400 }) }
}
