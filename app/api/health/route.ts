import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  const database = process.env.DATABASE_URL ? 'connected' : 'not_configured'

  return NextResponse.json({
    app: 'ok',
    database,
    runtime: process.env.NEXT_RUNTIME || 'node',
    aiProvider: process.env.AI_PROVIDER || 'mock',
  })
}
