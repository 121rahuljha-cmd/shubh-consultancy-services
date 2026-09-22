import { services } from '@/lib/site-data'

export type RelationshipType = 'related' | 'sub_service' | 'prerequisite' | 'next_step' | 'alternative' | 'complementary'
export type ServiceRelationship = { primaryServiceId: string; relatedServiceId: string; type: RelationshipType; enabled: boolean; anchorText?: string }
export type ClusterConfig = { id: string; pillarServiceId: string; relatedServiceIds: string[]; automaticLinking: boolean; maxLocationLinks: number; maxRelatedServices: number; maxRelatedCities: number }

export const clusterConfigs: ClusterConfig[] = [
  { id: 'trademark', pillarServiceId: 'trademark-registration', relatedServiceIds: ['trademark-search', 'trademark-objection', 'trademark-opposition', 'trademark-renewal', 'trademark-rectification'], automaticLinking: true, maxLocationLinks: 36, maxRelatedServices: 8, maxRelatedCities: 10 },
  { id: 'gst', pillarServiceId: 'gst-registration', relatedServiceIds: ['gst-return-filing'], automaticLinking: true, maxLocationLinks: 36, maxRelatedServices: 8, maxRelatedCities: 10 },
  { id: 'business-registration', pillarServiceId: 'private-limited-company-registration', relatedServiceIds: ['one-person-company-registration', 'limited-liability-partnership-registration', 'partnership-firm-registration', 'sole-proprietorship-registration', 'section-8-ngo-registration'], automaticLinking: true, maxLocationLinks: 36, maxRelatedServices: 8, maxRelatedCities: 10 },
]

export const serviceRelationships: ServiceRelationship[] = clusterConfigs.flatMap((cluster) => cluster.relatedServiceIds.map((relatedServiceId) => ({ primaryServiceId: cluster.pillarServiceId, relatedServiceId, type: relatedServiceId.includes('search') ? 'prerequisite' : 'related', enabled: true })))
export const getClusterForService = (serviceId: string) => clusterConfigs.find((cluster) => cluster.pillarServiceId === serviceId || cluster.relatedServiceIds.includes(serviceId))
export const getClusterServices = (serviceId: string) => { const cluster = getClusterForService(serviceId); if (!cluster) return services.filter((service) => service.slug === serviceId); const ids = [cluster.pillarServiceId, ...cluster.relatedServiceIds]; return ids.map((id) => services.find((service) => service.slug === id)).filter((service): service is (typeof services)[number] => Boolean(service)) }
export const getRelatedServices = (serviceId: string) => { const cluster = getClusterForService(serviceId); if (!cluster || !cluster.automaticLinking) return []; return getClusterServices(serviceId).filter((service) => service.slug !== serviceId).slice(0, cluster.maxRelatedServices) }
export const getClusterGraph = (serviceId: string) => { const cluster = getClusterForService(serviceId); const clusterServices = getClusterServices(serviceId); return { clusterId: cluster?.id ?? null, pillar: clusterServices.filter((service) => service.slug === cluster?.pillarServiceId), relatedServices: getRelatedServices(serviceId), serviceCount: clusterServices.length, statePages: 0, cityPages: 0, published: clusterServices.length } }
export const isPublicLinkable = (serviceId: string) => services.some((service) => service.slug === serviceId)
