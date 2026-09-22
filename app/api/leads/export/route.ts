import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getServerSession } from '@/lib/auth-boundary'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required before leads can be exported.' }, { status: 503 })
  const url = new URL(request.url); const status = url.searchParams.get('status') || undefined; const query = url.searchParams.get('q') || undefined
  const leads = await prisma.lead.findMany({ where: { ...(status ? { status: status as never } : {}), ...(query ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { mobile: { contains: query } }, { email: { contains: query, mode: 'insensitive' } }, { service: { contains: query, mode: 'insensitive' } }] } : {}) }, orderBy: { createdAt: 'desc' } })
  const rows = leads.map((lead) => ({ 'Lead ID': lead.id, Date: lead.createdAt.toISOString().slice(0, 10), Time: lead.createdAt.toISOString().slice(11, 19), Name: lead.name, Mobile: lead.mobile, WhatsApp: lead.whatsapp || '', Email: lead.email || '', 'Business Name': lead.businessName || '', Service: lead.service || '', Category: lead.category || '', State: lead.state || '', City: lead.city || '', Message: lead.message || '', 'Landing Page': lead.landingPage || '', Source: lead.source || '', Medium: lead.medium || '', Campaign: lead.campaign || '', Status: lead.status, 'Assigned To': lead.assignedTo || '', 'Follow-up Date': lead.followUpAt?.toISOString() || '', Notes: lead.notes || '', 'Created At': lead.createdAt.toISOString() }))
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Leads'); const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="shubh-leads.xlsx"' } })
}
