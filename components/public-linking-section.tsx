import { getPublicLinkSets } from '@/lib/public-linking'
import { PublicLinkingSections } from '@/components/public-linking-sections'

export async function PublicLinkingSection({ pageId }: { pageId: string }) { return <PublicLinkingSections sets={await getPublicLinkSets(pageId)} /> }
