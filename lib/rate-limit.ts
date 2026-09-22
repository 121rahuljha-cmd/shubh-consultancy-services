const windowMs = 60_000
const memory = new Map<string, { count: number; resetAt: number }>()

export type RateLimitOptions = {
  max: number
  windowMs?: number
  key?: string
}

export const checkRateLimit = (key: string, { max, windowMs: customWindowMs = windowMs }: RateLimitOptions) => {
  const now = Date.now()
  const bucket = memory.get(key) || { count: 0, resetAt: now + customWindowMs }
  if (now > bucket.resetAt) {
    bucket.count = 0
    bucket.resetAt = now + customWindowMs
  }
  bucket.count += 1
  memory.set(key, bucket)
  return bucket.count <= max
}

export const rateLimitHeaders = (key: string, options: RateLimitOptions) => {
  const bucket = memory.get(key)
  const limit = options.max
  const remaining = Math.max(0, limit - (bucket?.count || 0))
  const resetIn = Math.max(0, Math.ceil(((bucket?.resetAt || Date.now() + (options.windowMs || windowMs)) - Date.now()) / 1000))
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetIn),
  }
}
