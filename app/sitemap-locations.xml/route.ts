import { getSitemapChunks, sitemapXml } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const chunks = await getSitemapChunks('locations')
  const part = Number(new URL(request.url).searchParams.get('part') || '1')
  if (!Number.isInteger(part) || part < 1 || part > Math.max(1, chunks.length)) return new Response('Sitemap part not found.', { status: 404 })
  return new Response(sitemapXml(chunks[part - 1] || []), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}