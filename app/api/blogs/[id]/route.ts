import { NextResponse } from 'next/server'
import { can, getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'

export const dynamic = 'force-dynamic'

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  const localBypass = process.env.NODE_ENV === 'development'
  if (!localBypass && !session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!localBypass && session && !can(session, 'edit')) return NextResponse.json({ error: 'Your role cannot delete blog posts.' }, { status: 403 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed blogs.' }, { status: 503 })
  const { id } = await context.params
  try {
    await createProductionRepository().deleteBlog(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Blog could not be deleted. It may no longer exist.' }, { status: 404 })
  }
}
