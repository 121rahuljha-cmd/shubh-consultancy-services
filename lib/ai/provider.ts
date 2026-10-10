import type { AiAction, AiContext } from '@/lib/ai/prompts'
import type { ServiceBuilderRecord } from '@/lib/service-builder'
import type { CompetitorResearchInput, SeoResearchContext, SeoResearchRecord } from '@/lib/seo-research'
import type { ValidatedAiOutput } from '@/lib/ai/schemas'
import type { CmsSection, SectionAiContext } from '@/lib/cms-sections'

export type AiSuggestion = { action: AiAction; summary: string; changes: Partial<ServiceBuilderRecord>; notes: string[]; prompt: string; structured?: ValidatedAiOutput }
export interface AiProvider { readonly name: string; generate(action: AiAction, context: AiContext, section?: string): Promise<AiSuggestion> }
export interface SectionAiProvider { readonly name: string; generateSection(context: SectionAiContext): Promise<CmsSection> }
export function getAiProvider(): AiProvider { return mockAiProvider }
export async function getAiProviderStatusFromServer(selectedProvider = 'openai'): Promise<AiProviderStatus> {
	try {
		const response = await fetch('/api/ai/generate', { cache: 'no-store' })
		if (!response.ok) return { mode: 'unavailable', label: 'Unavailable', detail: 'AI provider status could not be loaded.' }
		const result = await response.json() as { providers?: Array<{provider: string; configured: boolean; model: string}> }
		const provider = result.providers?.find((item) => item.provider === selectedProvider)
		const labels: Record<string, string> = { openai: 'OpenAI', claude: 'Claude', gemini: 'Gemini' }
		const label = labels[selectedProvider] || selectedProvider
		if (!provider) return { mode: 'unavailable', label: `${label} · Unavailable`, detail: 'Provider status could not be loaded.' }
		return provider.configured ? { mode: 'real', label: `${label} · Connected`, detail: `${label} is configured (${provider.model}).` } : { mode: 'unavailable', label: `${label} · Not Configured`, detail: `Add the ${label} API key in server environment variables.` }
	} catch { return { mode: 'unavailable', label: 'Unavailable', detail: 'AI provider status could not be loaded.' } }
}
export async function generateWithServerAi(action: AiAction, context: AiContext, section?: string, options?: { provider?: string; prompt?: string; referenceUrls?: string[] }): Promise<AiSuggestion> {
	const response = await fetch('/api/ai/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, context, section, provider: options?.provider, prompt: options?.prompt, referenceUrls: options?.referenceUrls }) })
	const result = await response.json() as AiSuggestion & { error?: string }
	if (!response.ok) throw new Error(result.error || 'AI provider failure.')
	return result
}
export async function generateSectionWithServerAi(context: SectionAiContext): Promise<CmsSection> {
	const response = await fetch('/api/ai/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'section-edit', sectionContext: context }) })
	const result = await response.json() as CmsSection & { error?: string }
	if (!response.ok) throw new Error(result.error || 'AI provider failure.')
	return result
}
export type AiProviderMode = 'mock' | 'real' | 'unavailable'
export type AiProviderStatus = { mode: AiProviderMode; label: string; detail: string }
export function getAiProviderStatus(): AiProviderStatus { return { mode: 'mock', label: 'Mock', detail: 'Real AI provider is not configured. Mock mode is active.' } }
export interface SeoResearchProvider {
	readonly name: string
	researchService(context: SeoResearchContext): Promise<SeoResearchRecord>
	researchKeywords(context: SeoResearchContext): Promise<SeoResearchRecord>
	analyzeIntent(context: SeoResearchContext): Promise<SeoResearchRecord>
	buildTopicMap(context: SeoResearchContext): Promise<SeoResearchRecord>
	buildEntityMap(context: SeoResearchContext): Promise<SeoResearchRecord>
	analyzeContentGaps(context: SeoResearchContext): Promise<SeoResearchRecord>
	analyzeCompetitors(context: SeoResearchContext, competitor: CompetitorResearchInput): Promise<SeoResearchRecord>
	researchLocalSeo(context: SeoResearchContext): Promise<SeoResearchRecord>
	buildContentBlueprint(context: SeoResearchContext): Promise<SeoResearchRecord>
}
export function getSeoResearchProvider(): SeoResearchProvider { return mockSeoResearchProvider }
import { mockSeoResearchProvider } from '@/lib/ai/mock-provider'
import { mockAiProvider } from '@/lib/ai/mock-provider'
