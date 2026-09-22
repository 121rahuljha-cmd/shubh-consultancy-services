import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-boundary'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required before leads can be updated.' }, { status: 503 })
  const body = await request.json() as { ids?: string[]; status?: string; assignedTo?: string }
  const statuses = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'CONVERTED', 'CLOSED', 'SPAM', 'ARCHIVED']
  if (!body.ids?.length || (body.status && !statuses.includes(body.status))) return NextResponse.json({ error: 'Lead ids and a valid update are required.' }, { status: 400 })
  const result = await prisma.lead.updateMany({ where: { id: { in: body.ids } }, data: { ...(body.status ? { status: body.status as never } : {}), ...(body.assignedTo === undefined ? {} : { assignedTo: body.assignedTo.slice(0, 120) }) } })
  return NextResponse.json({ updated: result.count })
}
