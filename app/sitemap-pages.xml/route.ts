import { getSitemapChunks, sitemapXml, type SitemapSegment } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return segmentResponse(request, 'pages')
}

async function segmentResponse(request: Request, segment: SitemapSegment) {
  const chunks = await getSitemapChunks(segment)
  const part = Number(new URL(request.url).searchParams.get('part') || '1')
  if (!Number.isInteger(part) || part < 1 || part > Math.max(1, chunks.length)) return new Response('Sitemap part not found.', { status: 404 })
  return new Response(sitemapXml(chunks[part - 1] || []), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}