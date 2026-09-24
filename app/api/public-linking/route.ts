import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { getPublicLinkSets, publicLinkIndex, savePublicLinkSets, type PublicLinkSets } from '@/lib/public-linking'

export const dynamic = 'force-dynamic'
const localBypass = process.env.ADMIN_DEV_BYPASS === 'true'

export async function GET() { if (!localBypass && !(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); return NextResponse.json({ pages: await publicLinkIndex() }) }
export async function POST(request: Request) { if (!localBypass && !(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); try { const body = await request.json() as { pageId?: string; sets?: PublicLinkSets }; if (!body.pageId || !body.sets) return NextResponse.json({ error: 'Page id and link sets are required.' }, { status: 400 }); return NextResponse.json({ sets: await savePublicLinkSets(body.pageId, body.sets) }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Links could not be saved.' }, { status: 400 }) } }
export async function PUT(request: Request) { return POST(request) }
