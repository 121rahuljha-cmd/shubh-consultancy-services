import 'server-only'

import OpenAI from 'openai'
import type { AiAction, AiContext } from '@/lib/ai/prompts'
import { promptFor } from '@/lib/ai/prompts'
import { safeChangesForOutput, validateAiOutput, type AiOutputKind } from '@/lib/ai/schemas'
import type { AiProvider, AiSuggestion } from '@/lib/ai/provider'
import { validateCmsSection, type CmsSection, type SectionAiContext } from '@/lib/cms-sections'

export type ServerAiConfig = { provider: string; model: string; configured: boolean }
export function getServerAiConfig(): ServerAiConfig { const provider = process.env.AI_PROVIDER || 'mock'; return { provider, model: process.env.AI_MODEL || 'gpt-4o-mini', configured: provider !== 'openai' || Boolean(process.env.OPENAI_API_KEY) } }

const outputKind = (action: AiAction): AiOutputKind => action === 'complete-page' ? 'complete-page' : action === 'seo' ? 'seo' : action === 'faqs' ? 'faqs' : action === 'benefits' ? 'benefits' : action === 'process' ? 'process' : action === 'documents' ? 'documents' : action === 'local-seo' ? 'local-seo' : action === 'content-gap' || action === 'entities' || action === 'internal-links' ? 'custom' : 'about'
const errorMessage = (error: unknown) => error instanceof OpenAI.APIError && error.status === 429 ? 'OpenAI rate limit reached. Please wait and try again.' : error instanceof DOMException && error.name === 'AbortError' ? 'The AI request timed out. Please try again.' : error instanceof Error ? error.message : 'The AI provider failed. Please try again.'

export class OpenAiProvider implements AiProvider {
  readonly name = 'OpenAI server provider'
  async generate(action: AiAction, context: AiContext, section?: string): Promise<AiSuggestion> {
    const config = getServerAiConfig()
    if (config.provider !== 'openai' || !process.env.OPENAI_API_KEY) throw new Error('OpenAI API key is not configured.')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000, maxRetries: 1 })
    const prompt = action === 'complete-page' ? promptFor(action, context, section) : promptFor(action, context, section)
    try {
      const response = await client.chat.completions.create({ model: config.model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a careful content assistant. Return valid JSON only. Never invent regulatory or local facts.' }, { role: 'user', content: prompt }] })
      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('OpenAI returned an empty response.')
      let parsed: unknown
      try { parsed = JSON.parse(content) } catch { throw new Error('OpenAI returned invalid JSON.') }
      const kind = outputKind(action)
      const structured = validateAiOutput(kind, parsed)
      if (!structured) throw new Error('OpenAI returned a response that failed structured validation.')
      return { action, summary: `OpenAI ${action} suggestion for ${context.service}`, changes: safeChangesForOutput(kind, structured.output), notes: ['OpenAI output was validated against the existing CMS schema.', 'Review every regulatory, pricing, location and business claim before accepting.', 'Uncertain claims must be verified before publication.'], prompt, structured }
    } catch (error) { throw new Error(errorMessage(error)) }
  }
}

export async function generateServerSection(context: SectionAiContext): Promise<CmsSection> {
  if (process.env.AI_PROVIDER !== 'openai' || !process.env.OPENAI_API_KEY) throw new Error('OpenAI API key is not configured.')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000, maxRetries: 1 })
  const prompt = `Update only this CMS section for ${context.service}. Page type: ${context.pageType}. State: ${context.state || 'not supplied'}. City: ${context.city || 'not supplied'}. Primary keyword: ${context.primaryKeyword || 'not supplied'}. Search intent: ${context.searchIntent || 'not supplied'}. Audience: ${context.targetAudience || 'not supplied'}. Admin instruction: ${context.instruction}. Preserve the section type exactly: ${context.current.type}. Current section JSON: ${JSON.stringify(context.current)}. Surrounding sections for context only: ${JSON.stringify(context.surrounding)}. Return JSON only matching the current section shape. Do not invent legal, regulatory, fee, deadline, government, local or testimonial claims; write VERIFY FACT where needed.`
  try {
    const response = await client.chat.completions.create({ model: getServerAiConfig().model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You edit one CMS section at a time. Return only valid JSON for that section.' }, { role: 'user', content: prompt }] })
    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('OpenAI returned an empty section.')
    const proposal = validateCmsSection(JSON.parse(content), context.current)
    if (!proposal) throw new Error('OpenAI returned an invalid CMS section.')
    return proposal
  } catch (error) { throw new Error(errorMessage(error)) }
}

export function getServerAiProvider(): AiProvider { return new OpenAiProvider() }