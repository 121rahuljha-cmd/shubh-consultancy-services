import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { getPublicLinkSets } from '@/lib/public-linking'

export const dynamic = 'force-dynamic'
export async function GET(_: Request, { params }: { params: Promise<{ pageId: string }> }) { const localBypass = process.env.ADMIN_DEV_BYPASS === 'true'; if (!localBypass && !(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); const { pageId } = await params; return NextResponse.json({ sets: await getPublicLinkSets(pageId) }) }
