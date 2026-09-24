import { NextResponse } from 'next/server'

import { createClient, listClients, saveClients } from '@/lib/clients'
import { getServerSession } from '@/lib/auth-boundary'

export const dynamic = 'force-dynamic'

async function authorized() {
  return process.env.ADMIN_DEV_BYPASS === 'true' || Boolean(await getServerSession())
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  return NextResponse.json({ clients: await listClients() })
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>
    return NextResponse.json({ clients: await createClient(body) }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Client could not be created.' }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  try {
    const body = await request.json() as { clients?: unknown }
    return NextResponse.json({ clients: await saveClients(body.clients) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Clients could not be saved.' }, { status: 400 })
  }
}
