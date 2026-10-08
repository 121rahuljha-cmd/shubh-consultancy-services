import 'server-only'

import { getPublishedPublicRouteOverride, type PublicRouteKey } from '@/lib/public-route-overrides'

export type PublicRouteMetadata = {
  title?: string
  description?: string
  canonical?: string
  robotsIndex?: boolean
  robotsFollow?: boolean
}

export async function getPublicRouteMetadata(routeKey: PublicRouteKey): Promise<PublicRouteMetadata> {
  const override = await getPublishedPublicRouteOverride(routeKey)
  const content = override?.content || {}
  return {
    title: typeof content.title === 'string' ? content.title : undefined,
    description: typeof content.description === 'string' ? content.description : undefined,
    canonical: typeof content.canonicalUrl === 'string' ? content.canonicalUrl : undefined,
    robotsIndex: typeof content.robotsIndex === 'boolean' ? content.robotsIndex : undefined,
    robotsFollow: typeof content.robotsFollow === 'boolean' ? content.robotsFollow : undefined,
  }
}
