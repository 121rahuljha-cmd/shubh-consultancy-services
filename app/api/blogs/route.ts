import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'

export const dynamic = 'force-dynamic'
const unavailable = () => NextResponse.json({ error: 'DATABASE_URL is required for database-backed blogs.' }, { status: 503 })

export async function GET() { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return unavailable(); try { return NextResponse.json({ blogs: await createProductionRepository().listBlogs() }) } catch { return NextResponse.json({ error: 'Blogs could not be loaded.' }, { status: 503 }) } }
export async function POST(request: Request) { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return unavailable(); const body = await request.json() as { id?: string; slug?: string; title?: string; content?: unknown; status?: 'draft' | 'published' | 'unpublished' }; if (!body.slug || !body.title || body.content === undefined) return NextResponse.json({ error: 'Blog slug, title and content are required.' }, { status: 400 }); try { return NextResponse.json({ blog: await createProductionRepository().saveBlog({ id: body.id, slug: body.slug, title: body.title, content: body.content, status: body.status }) }, { status: 201 }) } catch { return NextResponse.json({ error: 'Blog could not be saved.' }, { status: 400 }) } }
