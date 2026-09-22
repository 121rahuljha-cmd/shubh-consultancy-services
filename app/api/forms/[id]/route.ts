import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-boundary'

export const dynamic = 'force-dynamic'
const guard = async () => { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required before forms can be edited.' }, { status: 503 }); return null }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { const denied = await guard(); if (denied) return denied; const body = await request.json() as { name?: string; description?: string; fields?: unknown; active?: boolean }; const { id } = await params; return NextResponse.json({ form: await prisma.contactForm.update({ where: { id }, data: { ...(body.name ? { name: body.name.slice(0, 120) } : {}), ...(body.description === undefined ? {} : { description: body.description.slice(0, 500) }), ...(body.fields === undefined ? {} : { fields: body.fields as never }), ...(body.active === undefined ? {} : { active: body.active }) } }) }) }
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { const denied = await guard(); if (denied) return denied; const { id } = await params; return NextResponse.json({ form: await prisma.contactForm.update({ where: { id }, data: { active: false } }) }) }
