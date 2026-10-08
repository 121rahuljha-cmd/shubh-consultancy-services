import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth-boundary'
import { listPublicRouteOverrides, savePublicRouteOverride } from '@/lib/public-route-overrides'

export const dynamic = 'force-dynamic'

async function guard() {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for route overrides.' }, { status: 503 })
  return null
}

export async function GET() {
  const denial = await guard()
  if (denial) return denial
  return NextResponse.json({ overrides: await listPublicRouteOverrides() })
}

export async function POST(request: Request) {
  const denial = await guard()
  if (denial) return denial
  try {
    const body = await request.json()
    if (!body?.routeKey || !body?.content) return NextResponse.json({ error: 'Route key and content are required.' }, { status: 400 })
    return NextResponse.json({ override: await savePublicRouteOverride({
      routeKey: body.routeKey,
      status: body.status || 'DRAFT',
      revision: body.revision || 1,
      content: body.content,
    }) }, { status: body.status === 'PUBLISHED' ? 201 : 200 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Route override could not be saved.' }, { status: 400 })
  }
}
