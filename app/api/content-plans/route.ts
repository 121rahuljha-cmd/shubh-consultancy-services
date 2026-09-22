import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'
import type { ContentPlan } from '@/lib/content-plan'

export const dynamic = 'force-dynamic'
export async function GET() { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed content plans.' }, { status: 503 }); return NextResponse.json({ plans: await createProductionRepository().listContentPlans() }) }
export async function POST(request: Request) { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for database-backed content plans.' }, { status: 503 }); const plan = await request.json() as ContentPlan; if (!plan.id || !plan.title || !plan.slug) return NextResponse.json({ error: 'Plan id, title and slug are required.' }, { status: 400 }); try { return NextResponse.json({ plan: await createProductionRepository().saveContentPlan(plan) }, { status: 201 }) } catch { return NextResponse.json({ error: 'Content plan could not be saved.' }, { status: 400 }) } }
