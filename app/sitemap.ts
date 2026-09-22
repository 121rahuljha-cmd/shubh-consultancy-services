import type { MetadataRoute } from 'next'
import { services, serviceCategories } from '@/lib/site-data'
import { categorySlug } from '@/lib/service-inventory'
import { isEligibleSitemapPath, productionOrigin } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = productionOrigin()
  const routes = [
    '/',
    '/contact',
    '/services',
    ...serviceCategories.map((category) => `/services/category/${categorySlug(category)}`),
    ...services.map((service) => `/services/${service.slug}`),
  ]

  return routes
    .filter((route) => isEligibleSitemapPath(route))
    .map((route) => ({
      url: `${baseUrl}${route}`,
      changeFrequency: route === '/' ? 'daily' : 'weekly',
      priority: route === '/' ? 1 : route.startsWith('/services/') ? 0.8 : 0.7,
    }))
}
