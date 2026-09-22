import rawInventory from '@/service-unified-inventory.json'
import { services } from '@/lib/site-data'

export type InventoryStatus = 'existing_shubh' | 'planned' | 'draft' | 'published' | 'excluded'
export type MatchType = 'exact_match' | 'close_match' | 'related' | 'unique_corpbiz' | 'unique_indiafilings' | 'existing_shubh'
export type ServiceInventoryRecord = {
  id: string
  canonicalTitle: string
  slug: string
  category: string
  subcategory: string
  corpbizTitle: string
  corpbizUrl: string
  corpbizCategory: string
  corpbizSubcategory: string
  indiafilingsTitle: string
  indiafilingsUrl: string
  indiafilingsCategory: string
  matchType: MatchType
  status: InventoryStatus
  existing: boolean
}

export const inventory = rawInventory.records as ServiceInventoryRecord[]
export const inventoryCategories = rawInventory.categories as string[]
export const existingShubhCount = services.length
export const sourceCounts = {
  corpbiz: inventory.filter((item) => item.corpbizUrl).length,
  indiafilings: inventory.filter((item) => item.indiafilingsUrl).length,
}
export const matchCounts = {
  exact: inventory.filter((item) => item.matchType === 'exact_match').length,
  close: inventory.filter((item) => item.matchType === 'close_match').length,
  related: inventory.filter((item) => item.matchType === 'related').length,
  corpbizOnly: inventory.filter((item) => item.matchType === 'unique_corpbiz').length,
  indiafilingsOnly: inventory.filter((item) => item.matchType === 'unique_indiafilings').length,
}
export const categorySlug = (category: string) => category.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const categoryForSlug = (slug: string) => inventoryCategories.find((category) => categorySlug(category) === slug)
export const publicServiceHref = (item: ServiceInventoryRecord) => item.status === 'existing_shubh' ? `/services/${item.slug}` : undefined
