import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { createProductionRepository } from '@/lib/database-repository'
import { pageText } from '@/lib/page-cms'

export const dynamic = 'force-dynamic'
export async function GET() { if (!(await getServerSession())) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL is required for content refresh analysis.' }, { status: 503 }); const pages = await createProductionRepository().listCmsPages(); const now = Date.now(); const items = pages.map((page) => { const ageDays = Math.floor((now - new Date(page.updatedAt).getTime()) / 86400000); const issues = [ageDays > 180 ? 'Old content' : '', !page.seoTitle || !page.metaDescription ? 'Missing SEO metadata' : '', pageText(page).trim().length < 900 ? 'Thin content' : '', !page.faqs.length ? 'Incomplete FAQ coverage' : '', page.schema.webPage === 'disabled' ? 'Missing schema' : ''].filter(Boolean); return { pageId: page.id, title: page.title, status: issues.length ? (ageDays > 180 || issues.includes('Thin content') ? 'Refresh Recommended' : 'Needs Review') : 'Recently Updated', ageDays, issues } }); return NextResponse.json({ items }) }
