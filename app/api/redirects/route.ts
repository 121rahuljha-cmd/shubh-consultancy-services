import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-boundary'

export const dynamic = 'force-dynamic'
const validPath = (value: string) => value.startsWith('/') && !value.startsWith('//') && !value.includes('://')
const guard = async () => { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for redirect management.' }, { status: 503 }); return null }
export async function GET() { const denied = await guard(); if (denied) return denied; return NextResponse.json({ redirects: await prisma.redirectRule.findMany({ orderBy: { updatedAt: 'desc' } }) }) }
export async function POST(request: Request) { const denied = await guard(); if (denied) return denied; const body = await request.json() as { oldPath?: string; newPath?: string; statusCode?: number; notes?: string }; if (!body.oldPath || !body.newPath || !validPath(body.oldPath) || !validPath(body.newPath) || body.oldPath === body.newPath || ![301, 308].includes(body.statusCode || 301)) return NextResponse.json({ error: 'Use distinct internal paths and status 301 or 308.' }, { status: 400 }); try { return NextResponse.json({ redirect: await prisma.redirectRule.create({ data: { oldPath: body.oldPath, newPath: body.newPath, statusCode: body.statusCode || 301, notes: body.notes?.slice(0, 500) } }) }, { status: 201 }) } catch { return NextResponse.json({ error: 'Redirect already exists or is invalid.' }, { status: 400 }) } }
