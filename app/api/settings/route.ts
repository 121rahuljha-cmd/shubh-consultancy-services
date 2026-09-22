import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-boundary'

export const dynamic = 'force-dynamic'
const guard = async () => { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for settings.' }, { status: 503 }); return null }
export async function GET() { const denied = await guard(); if (denied) return denied; return NextResponse.json({ settings: await prisma.globalSetting.findMany({ orderBy: { key: 'asc' } }) }) }
export async function PUT(request: Request) { const denied = await guard(); if (denied) return denied; const body = await request.json() as { key?: string; value?: unknown }; if (!body.key || body.value === undefined || !/^[a-z0-9._-]{2,100}$/.test(body.key)) return NextResponse.json({ error: 'A valid setting key and value are required.' }, { status: 400 }); return NextResponse.json({ setting: await prisma.globalSetting.upsert({ where: { key: body.key }, create: { key: body.key, value: body.value as never }, update: { value: body.value as never } }) }) }
