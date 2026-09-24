import { NextResponse } from 'next/server'
import { generateBatchOneDrafts } from '@/lib/page-generator'

export const dynamic = 'force-dynamic'

export async function GET() {
  const bundle = await generateBatchOneDrafts()
  return NextResponse.json({
    ok: true,
    totalRows: bundle.totalRows,
    batchSize: bundle.batchSize,
    generatedCount: bundle.generated.length,
    summary: bundle.summary.slice(0, 10),
  })
}

export async function POST() {
  const bundle = await generateBatchOneDrafts()
  return NextResponse.json({
    ok: true,
    totalRows: bundle.totalRows,
    batchSize: bundle.batchSize,
    generatedCount: bundle.generated.length,
    pages: bundle.generated,
    summary: bundle.summary,
  })
}
