import type { AiAction, AiContext } from '@/lib/ai/prompts'
import type { ServiceBuilderRecord } from '@/lib/service-builder'
import type { CompetitorResearchInput, SeoResearchContext, SeoResearchRecord } from '@/lib/seo-research'
import type { ValidatedAiOutput } from '@/lib/ai/schemas'
import type { CmsSection, SectionAiContext } from '@/lib/cms-sections'
import { mockSeoResearchProvider, mockAiProvider } from '@/lib/ai/mock-provider'

export type AiSuggestion = {
  action: AiAction
  summary: string
  changes: Partial<ServiceBuilderRecord>
  notes: string[]
  prompt: string
  structured?: ValidatedAiOutput
}

export interface AiProvider {
  readonly name: string
  generate(action: AiAction, context: AiContext, section?: string): Promise<AiSuggestion>
}

export interface SectionAiProvider {
  readonly name: string
  generateSection(context: SectionAiContext): Promise<CmsSection>
}

export function getAiProvider(): AiProvider {
  return mockAiProvider
}

export async function getAiProviderStatusFromServer(): Promise<AiProviderStatus> {
  try {
    const response = await fetch('/api/ai/generate', { cache: 'no-store' })

    if (!response.ok) {
      return {
        mode: 'unavailable',
        label: 'Unavailable',
        detail: 'AI provider status could not be loaded. Check your admin session and try again.',
      }
    }

    const result = await response.json() as {
      provider?: string
      configured?: boolean
      model?: string
    }

    if (result.provider === 'openai' || result.provider === 'gemini') {
      const providerName = result.provider === 'gemini' ? 'Gemini' : 'OpenAI'

      if (!result.configured) {
        return {
          mode: 'unavailable',
          label: `${providerName} · Not configured`,
          detail: `${providerName} is selected, but its server-side API key is not configured.`,
        }
      }

      return {
        mode: 'real',
        label: `${providerName} · Connected`,
        detail: `Server-side ${providerName} provider is ready (${result.model || 'configured model'}).`,
      }
    }

    if (result.provider === 'mock') {
      return {
        mode: 'mock',
        label: 'Mock mode',
        detail: 'Demo suggestions are active. No external AI request will be made.',
      }
    }

    return {
      mode: 'unavailable',
      label: 'Unsupported provider',
      detail: 'Choose OpenAI, Gemini, or mock mode in the server configuration.',
    }
  } catch {
    return {
      mode: 'unavailable',
      label: 'Unavailable',
      detail: 'AI provider status could not be loaded. Check the connection and try again.',
    }
  }
}

export async function generateWithServerAi(
  action: AiAction,
  context: AiContext,
  section?: string,
): Promise<AiSuggestion> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, context, section }),
  })
  const result = await response.json() as AiSuggestion & { error?: string }
  if (!response.ok) throw new Error(result.error || 'AI provider failure.')
  return result
}

export async function generateSectionWithServerAi(context: SectionAiContext): Promise<CmsSection> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'section-edit', sectionContext: context }),
  })
  const result = await response.json() as CmsSection & { error?: string }
  if (!response.ok) throw new Error(result.error || 'AI provider failure.')
  return result
}

export type AiProviderMode = 'mock' | 'real' | 'unavailable'
export type AiProviderStatus = { mode: AiProviderMode; label: string; detail: string }

export function getAiProviderStatus(): AiProviderStatus {
  return {
    mode: 'unavailable',
    label: 'Checking provider',
    detail: 'Checking server-side AI configuration. Please wait before generating content.',
  }
}

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

export function getSeoResearchProvider(): SeoResearchProvider {
  return mockSeoResearchProvider
}
