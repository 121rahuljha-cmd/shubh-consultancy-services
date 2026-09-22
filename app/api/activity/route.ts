import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-boundary'

export const dynamic = 'force-dynamic'
export async function GET() { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for activity logs.' }, { status: 503 }); return NextResponse.json({ entries: await prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }) }) }
export async function POST(request: Request) { const session = await getServerSession(); if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for activity logs.' }, { status: 503 }); const body = await request.json() as { action?: string; entity?: string; entityId?: string; metadata?: unknown }; if (!body.action || !body.entity) return NextResponse.json({ error: 'Action and entity are required.' }, { status: 400 }); return NextResponse.json({ entry: await prisma.activityLog.create({ data: { userId: session.userId, action: body.action.slice(0, 100), entity: body.entity.slice(0, 100), entityId: body.entityId?.slice(0, 120), metadata: body.metadata as never } }) }, { status: 201 }) }
