import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository, listPublishedBlogs, saveBlogServer } from '@/lib/database-repository'

export const dynamic = 'force-dynamic'
const unavailable = () => NextResponse.json({ error: 'DATABASE_URL is required for database-backed blogs.' }, { status: 503 })

export async function GET() {
  const localBypass = process.env.NODE_ENV === 'development'
  if (!localBypass && !(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV !== 'development') return unavailable()
    return NextResponse.json({ blogs: await listPublishedBlogs() })
  }

  try {
    return NextResponse.json({ blogs: await createProductionRepository().listBlogs() })
  } catch {
    return NextResponse.json({ error: 'Blogs could not be loaded.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const localBypass = process.env.NODE_ENV === 'development'
  if (!localBypass && !(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'development') return unavailable()

  const body = await request.json() as { id?: string; slug?: string; title?: string; content?: unknown; status?: 'draft' | 'published' | 'unpublished' }
  if (!body.slug || !body.title || body.content === undefined) return NextResponse.json({ error: 'Blog slug, title and content are required.' }, { status: 400 })

  try {
    return NextResponse.json({ blog: await saveBlogServer({ id: body.id, slug: body.slug, title: body.title, content: body.content, status: body.status }) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Blog could not be saved.' }, { status: 400 })
  }
}
