export const productionOrigin = () => {
  const host = process.env.PUBLIC_SITE_URL || process.env.APP_URL || 'https://example.com'
  return host.replace(/\/$/, '')
}

export const normalizeCanonicalPath = (value: string) => {
  if (!value) return '/'
  const raw = value.trim()
  if (!raw.startsWith('/')) return `/${raw.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^.*?(?=\/)/, '')}`
  const normalized = raw.replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  return normalized === '' ? '/' : normalized
}

export const canonicalUrl = (path: string) => {
  const normalized = normalizeCanonicalPath(path)
  return `${productionOrigin()}${normalized}`
}

export const isEligibleSitemapPath = (path: string) => {
  if (!path || !path.startsWith('/')) return false
  if (['/admin', '/api', '/preview', '/_next', '/private'].some((prefix) => path === prefix || path.startsWith(prefix))) return false
  if (/\.(?:xml|txt|json|js|css|png|jpg|jpeg|gif|svg|webp|ico|map|pdf)$/i.test(path)) return false
  return true
}
