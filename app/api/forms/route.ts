import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-boundary'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required before forms can be loaded.' }, { status: 503 })
  return NextResponse.json({ items: await prisma.contactForm.findMany({ orderBy: { updatedAt: 'desc' } }) })
}

export async function POST(request: Request) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required before forms can be stored.' }, { status: 503 })
  const body = await request.json() as { name?: string; slug?: string; description?: string; fields?: unknown }
  if (!body.name?.trim() || !body.slug?.trim() || !Array.isArray(body.fields)) return NextResponse.json({ error: 'Name, slug and fields are required.' }, { status: 400 })
  try { const form = await prisma.contactForm.create({ data: { name: body.name.trim().slice(0, 120), slug: body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'), description: body.description?.trim().slice(0, 500) || '', fields: body.fields } }); return NextResponse.json({ form }, { status: 201 }) } catch { return NextResponse.json({ error: 'Form could not be created. Slugs must be unique.' }, { status: 400 }) }
}
