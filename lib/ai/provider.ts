import type { AiAction, AiContext } from '@/lib/ai/prompts'
import type { ServiceBuilderRecord } from '@/lib/service-builder'
import type { CompetitorResearchInput, SeoResearchContext, SeoResearchRecord } from '@/lib/seo-research'
import type { ValidatedAiOutput } from '@/lib/ai/schemas'
import type { CmsSection, SectionAiContext } from '@/lib/cms-sections'

export type AiSuggestion = { action: AiAction; summary: string; changes: Partial<ServiceBuilderRecord>; notes: string[]; prompt: string; structured?: ValidatedAiOutput }
export interface AiProvider { readonly name: string; generate(action: AiAction, context: AiContext, section?: string): Promise<AiSuggestion> }
export interface SectionAiProvider { readonly name: string; generateSection(context: SectionAiContext): Promise<CmsSection> }
export function getAiProvider(): AiProvider { return mockAiProvider }
export async function getAiProviderStatusFromServer(): Promise<AiProviderStatus> {
	try {
		const response = await fetch('/api/ai/generate', { cache: 'no-store' })
		if (!response.ok) return { mode: 'unavailable', label: 'Unavailable', detail: 'AI provider status could not be loaded.' }
		const result = await response.json() as { provider?: string; configured?: boolean; model?: string }
		if (result.provider === 'openai') return result.configured ? { mode: 'real', label: 'OpenAI · Connected', detail: `Server-side OpenAI provider is ready (${result.model || 'configured model'}).` } : { mode: 'unavailable', label: 'OpenAI · Not Configured', detail: 'OpenAI API key is not configured.' }
		return { mode: 'mock', label: 'Mock', detail: 'Mock provider is active. No external AI request will be made.' }
	} catch { return { mode: 'unavailable', label: 'Unavailable', detail: 'AI provider status could not be loaded.' } }
}
export async function generateWithServerAi(action: AiAction, context: AiContext, section?: string): Promise<AiSuggestion> {
	const response = await fetch('/api/ai/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, context, section }) })
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
