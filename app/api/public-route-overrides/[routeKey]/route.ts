import { NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth-boundary'
import { getPublishedPublicRouteOverride, isPublicRouteKey } from '@/lib/public-route-overrides'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ routeKey: string }> }) {
  const { routeKey } = await params
  if (!isPublicRouteKey(routeKey)) return NextResponse.json({ error: 'Route not found.' }, { status: 404 })
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for route overrides.' }, { status: 503 })
  const override = await getPublishedPublicRouteOverride(routeKey)
  return NextResponse.json({ override })
}
