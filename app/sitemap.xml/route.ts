import { sitemapIndexXml } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response(await sitemapIndexXml(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}