import { NextResponse } from 'next/server'
import { can, getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository, listPublishedBlogs, saveBlogServer } from '@/lib/database-repository'

export const dynamic = 'force-dynamic'
const unavailable = () => NextResponse.json({ error: 'DATABASE_URL is required for database-backed blogs.' }, { status: 503 })

export async function GET() {
  const session = await getServerSession()
  if (process.env.NODE_ENV !== 'development' && !session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV !== 'development') return unavailable()
    return NextResponse.json({ blogs: await listPublishedBlogs() })
  }
  try {
    const blogs = await createProductionRepository().listBlogs()\n    return NextResponse.json({ blogs: blogs.map(blog => ({ ...blog, status: String(blog.status).toLowerCase(), publishedAt: blog.publishedAt?.toISOString() || null, createdAt: blog.createdAt.toISOString(), updatedAt: blog.updatedAt.toISOString() })) })
  } catch {
    return NextResponse.json({ error: 'Blogs could not be loaded.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession()
  const localBypass = process.env.NODE_ENV === 'development'
  if (!localBypass && !session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = await request.json() as {
    id?: string; slug?: string; title?: string; content?: unknown; status?: 'draft' | 'published' | 'unpublished' | 'archived'
    excerpt?: string; author?: string; category?: string; tags?: unknown; featuredImage?: unknown; seo?: unknown; sections?: unknown
  }
  if (!body.slug || !body.title || body.content === undefined) return NextResponse.json({ error: 'Blog slug, title and content are required.' }, { status: 400 })
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)) return NextResponse.json({ error: 'Slug must use lowercase letters, numbers and hyphens.' }, { status: 400 })
  const status = body.status || 'draft'
  if (!localBypass && session && status === 'published' && !can(session, 'publish')) return NextResponse.json({ error: 'Your role cannot publish blog posts.' }, { status: 403 })
  if (!localBypass && session && !can(session, 'edit')) return NextResponse.json({ error: 'Your role cannot edit blog posts.' }, { status: 403 })
  if (!process.env.DATABASE_URL && !localBypass) return unavailable()

  try {
    const blog = await saveBlogServer({ id: body.id, slug: body.slug, title: body.title, content: body.content, status, excerpt: body.excerpt, author: body.author, category: body.category, tags: body.tags, featuredImage: body.featuredImage, seo: body.seo, sections: body.sections })
    return NextResponse.json({ blog: { ...blog, status: String(blog.status).toLowerCase(), publishedAt: blog.publishedAt?.toISOString() || null, createdAt: blog.createdAt.toISOString(), updatedAt: blog.updatedAt.toISOString() } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blog could not be saved.'
    return NextResponse.json({ error: message.includes('Unique constraint') ? 'That slug is already in use. Choose a unique slug.' : 'Blog could not be saved.' }, { status: 400 })
  }
}
