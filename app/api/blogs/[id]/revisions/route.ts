import { NextResponse } from 'next/server'
import { can, getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (process.env.NODE_ENV !== 'development' && !session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for revision history.' }, { status: 503 })
  const { id } = await context.params
  try {
    const repository = createProductionRepository()
    const blog = (await repository.listBlogs()).find(item => item.id === id)
    if (!blog) return NextResponse.json({ error: 'Blog not found.' }, { status: 404 })
    const revisions = await repository.listBlogRevisions(id)
    return NextResponse.json({ revisions: revisions.map(item => ({ ...item, status: String(item.status).toLowerCase(), createdAt: item.createdAt.toISOString() })) })
  } catch {
    return NextResponse.json({ error: 'Revision history could not be loaded.' }, { status: 503 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  const localBypass = process.env.NODE_ENV === 'development'
  if (!localBypass && !session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!localBypass && session && !can(session, 'edit')) return NextResponse.json({ error: 'Your role cannot restore blog revisions.' }, { status: 403 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for revision restore.' }, { status: 503 })
  const { id } = await context.params
  const body = await request.json() as { revisionId?: string }
  if (!body.revisionId) return NextResponse.json({ error: 'Revision ID is required.' }, { status: 400 })
  try {
    const blog = await createProductionRepository().restoreBlogRevision(id, body.revisionId)
    return NextResponse.json({ blog })
  } catch {
    return NextResponse.json({ error: 'Revision could not be restored.' }, { status: 404 })
  }
}
