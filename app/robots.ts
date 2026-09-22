import type { MetadataRoute } from 'next'
import { productionOrigin } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = productionOrigin()
  return {
    rules: [{ userAgent: '*', allow: ['/', '/contact', '/services', '/services/category'], disallow: ['/admin', '/admin/', '/api', '/api/', '/preview', '/preview/', '/private'] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
