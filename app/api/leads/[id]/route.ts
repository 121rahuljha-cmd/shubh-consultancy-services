import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-boundary'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required before leads can be updated.' }, { status: 503 })
  const body = await request.json() as { status?: string; notes?: string; assignedTo?: string; followUpAt?: string | null }
  const allowed = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'CLOSED', 'SPAM', 'ARCHIVED']
  const { id } = await params
  try { const lead = await prisma.lead.update({ where: { id }, data: { ...(body.status && allowed.includes(body.status) ? { status: body.status as never } : {}), ...(body.notes === undefined ? {} : { notes: body.notes.slice(0, 4000) }), ...(body.assignedTo === undefined ? {} : { assignedTo: body.assignedTo?.slice(0, 120) || null }), ...(body.followUpAt === undefined ? {} : { followUpAt: body.followUpAt ? new Date(body.followUpAt) : null }) } }); return NextResponse.json({ lead }) } catch { return NextResponse.json({ error: 'Lead could not be updated.' }, { status: 400 }) }
}
