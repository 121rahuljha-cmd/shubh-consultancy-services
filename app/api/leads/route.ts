import { NextResponse } from 'next/server'
import { createLead, listLeads, validateLeadInput } from '@/lib/leads'
import { getServerSession } from '@/lib/auth-boundary'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const key = `public:lead:${ip}`
  if (!checkRateLimit(key, { max: 6, windowMs: 60_000 })) {
    const headers = rateLimitHeaders(key, { max: 6, windowMs: 60_000 })
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait a minute and try again.' }, { status: 429, headers })
  }
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }) }
  const lead = validateLeadInput(body)
  if (!lead) return NextResponse.json({ error: 'Please provide a valid name and mobile number.' }, { status: 400 })
  try { await createLead(lead); return NextResponse.json({ ok: true }, { status: 201 }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Lead could not be stored.' }, { status: 503 }) }
}

export async function GET() {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  try { return NextResponse.json({ items: await listLeads() }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Leads could not be loaded.' }, { status: 503 }) }
}
