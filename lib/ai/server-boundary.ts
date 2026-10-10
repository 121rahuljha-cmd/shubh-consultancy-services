import 'server-only'

import OpenAI from 'openai'
import { GoogleGenAI } from '@google/genai'
import type { AiAction, AiContext } from '@/lib/ai/prompts'
import { promptFor } from '@/lib/ai/prompts'
import { safeChangesForOutput, validateAiOutput, type AiOutputKind } from '@/lib/ai/schemas'
import type { AiProvider, AiSuggestion } from '@/lib/ai/provider'
import { validateCmsSection, type CmsSection, type SectionAiContext } from '@/lib/cms-sections'

export type ServerAiConfig = {
  provider: string
  model: string
  configured: boolean
}

export type AiProviderId = 'openai' | 'claude' | 'gemini' | 'mock'

export function getServerAiConfig(providerOverride?: string): ServerAiConfig {
  const allowed: AiProviderId[] = ['openai', 'claude', 'gemini', 'mock']
  const requested = providerOverride || process.env.AI_PROVIDER || 'mock'
  const provider: AiProviderId = allowed.includes(requested as AiProviderId) ? requested as AiProviderId : 'mock'
  const configured = provider === 'openai'
    ? Boolean(process.env.OPENAI_API_KEY)
    : provider === 'claude'
      ? Boolean(process.env.ANTHROPIC_API_KEY)
      : provider === 'gemini'
        ? Boolean(process.env.GEMINI_API_KEY)
        : false
  const defaultModel = provider === 'claude' ? 'claude-sonnet-4-20250514' : provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'
  const model = provider === 'openai' ? process.env.OPENAI_MODEL : provider === 'claude' ? process.env.ANTHROPIC_MODEL : provider === 'gemini' ? process.env.GEMINI_MODEL : undefined
  return { provider, model: model || process.env.AI_MODEL || defaultModel, configured }
}

const outputKind = (action: AiAction): AiOutputKind =>
  action === 'complete-page'
    ? 'complete-page'
    : action === 'seo'
      ? 'seo'
      : action === 'faqs'
        ? 'faqs'
        : action === 'benefits'
          ? 'benefits'
          : action === 'process'
            ? 'process'
            : action === 'documents'
              ? 'documents'
              : action === 'local-seo'
                ? 'local-seo'
                : action === 'content-gap' ||
                    action === 'entities' ||
                    action === 'internal-links'
                  ? 'custom'
                  : 'about'

const errorMessage = (error: unknown, provider: string) => {
  if (
    provider === 'openai' &&
    error instanceof OpenAI.APIError &&
    error.status === 429
  ) {
    return 'OpenAI rate limit reached. Please wait and try again.'
  }

  if (
    error instanceof DOMException &&
    error.name === 'AbortError'
  ) {
    return 'The AI request timed out. Please try again.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'The AI provider failed. Please try again.'
}

const systemPrompt =
  'You are a careful content assistant. Return valid JSON only. Never invent regulatory or local facts.'

export class OpenAiProvider implements AiProvider {
  readonly name = 'OpenAI server provider'

  async generate(
    action: AiAction,
    context: AiContext,
    section?: string,
  ): Promise<AiSuggestion> {
    const config = getServerAiConfig('openai')

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured.')
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 1,
    })

    const prompt = promptFor(action, context, section)

    try {
      const response = await client.chat.completions.create({
        model: config.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const content = response.choices[0]?.message?.content

      if (!content) {
        throw new Error('OpenAI returned an empty response.')
      }

      let parsed: unknown

      try {
        parsed = JSON.parse(content)
      } catch {
        throw new Error('OpenAI returned invalid JSON.')
      }

      const kind = outputKind(action)
      const structured = validateAiOutput(kind, parsed)

      if (!structured) {
        throw new Error(
          'OpenAI returned a response that failed structured validation.',
        )
      }

      return {
        action,
        summary: `OpenAI ${action} suggestion for ${context.service}`,
        changes: safeChangesForOutput(kind, structured.output),
        notes: [
          'OpenAI output was validated against the existing CMS schema.',
          'Review every regulatory, pricing, location and business claim before accepting.',
          'Uncertain claims must be verified before publication.',
        ],
        prompt,
        structured,
      }
    } catch (error) {
      throw new Error(errorMessage(error, 'openai'))
    }
  }
}

export class GeminiProvider implements AiProvider {
  readonly name = 'Gemini server provider'

  async generate(
    action: AiAction,
    context: AiContext,
    section?: string,
  ): Promise<AiSuggestion> {
    const config = getServerAiConfig('gemini')

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured.')
    }

    const client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    const prompt = promptFor(action, context, section)

    try {
      const response = await client.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          systemInstruction: systemPrompt,
        },
      })

      const content = response.text

      if (!content) {
        throw new Error('Gemini returned an empty response.')
      }

      let parsed: unknown

      try {
        parsed = JSON.parse(content)
      } catch {
        throw new Error('Gemini returned invalid JSON.')
      }

      const kind = outputKind(action)
      const structured = validateAiOutput(kind, parsed)

      if (!structured) {
        throw new Error(
          'Gemini returned a response that failed structured validation.',
        )
      }

      return {
        action,
        summary: `Gemini ${action} suggestion for ${context.service}`,
        changes: safeChangesForOutput(kind, structured.output),
        notes: [
          'Gemini output was validated against the existing CMS schema.',
          'Review every regulatory, pricing, location and business claim before accepting.',
          'Uncertain claims must be verified before publication.',
        ],
        prompt,
        structured,
      }
    } catch (error) {
      throw new Error(errorMessage(error, 'gemini'))
    }
  }
}


export class ClaudeProvider implements AiProvider {
  readonly name = 'Claude server provider'

  async generate(action: AiAction, context: AiContext, section?: string): Promise<AiSuggestion> {
    const config = getServerAiConfig('claude')
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Claude API key is not configured.')
    const prompt = promptFor(action, context, section)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: config.model, max_tokens: 8192, temperature: 0.2, system: systemPrompt, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(30000),
      cache: 'no-store',
    })
    if (!response.ok) {
      if (response.status === 429) throw new Error('Claude rate limit reached. Please wait and try again.')
      throw new Error(`Claude API request failed (HTTP ${response.status}). Check the API key, model access, and provider status.`)
    }
    const payload = await response.json() as { content?: Array<{ type?: string; text?: string }> }
    const content = payload.content?.find((item) => item.type === 'text')?.text
    if (!content) throw new Error('Claude returned an empty response.')
    let parsed: unknown
    try {
      const cleaned = content.trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '')
      parsed = JSON.parse(cleaned)
    } catch { throw new Error('Claude returned invalid JSON.') }
    const kind = outputKind(action)
    const structured = validateAiOutput(kind, parsed)
    if (!structured) throw new Error('Claude returned a response that failed structured validation.')
    return {
      action,
      summary: `Claude ${action} suggestion for ${context.service}`,
      changes: safeChangesForOutput(kind, structured.output),
      notes: ['Claude output was validated against the existing CMS schema.', 'Review regulatory, pricing, location and business claims before accepting.', 'Uncertain claims must be verified before publication.'],
      prompt,
      structured,
    }
  }
}

export async function generateServerSection(
  context: SectionAiContext,
): Promise<CmsSection> {
  const config = getServerAiConfig()

  if (!config.configured) {
    throw new Error(`${config.provider} API key is not configured.`)
  }

  const prompt = `Update only this CMS section for ${context.service}. Page type: ${context.pageType}. State: ${context.state || 'not supplied'}. City: ${context.city || 'not supplied'}. Primary keyword: ${context.primaryKeyword || 'not supplied'}. Search intent: ${context.searchIntent || 'not supplied'}. Audience: ${context.targetAudience || 'not supplied'}. Admin instruction: ${context.instruction}. Preserve the section type exactly: ${context.current.type}. Current section JSON: ${JSON.stringify(context.current)}. Surrounding sections for context only: ${JSON.stringify(context.surrounding)}. Return JSON only matching the current section shape. Do not invent legal, regulatory, fee, deadline, government, local or testimonial claims; write VERIFY FACT where needed.`

  try {
    let content: string | undefined

    if (config.provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured.')
      }

      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000,
        maxRetries: 1,
      })

      const response = await client.chat.completions.create({
        model: config.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You edit one CMS section at a time. Return only valid JSON for that section.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      content = response.choices[0]?.message?.content ?? undefined
    } else if (config.provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured.')
      }

      const client = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      })

      const response = await client.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          systemInstruction:
            'You edit one CMS section at a time. Return only valid JSON for that section.',
        },
      })

      content = response.text
    } else {
      throw new Error(`Unsupported AI provider: ${config.provider}`)
    }

    if (!content) {
      throw new Error(`${config.provider} returned an empty section.`)
    }

    const proposal = validateCmsSection(
      JSON.parse(content),
      context.current,
    )

    if (!proposal) {
      throw new Error(
        `${config.provider} returned an invalid CMS section.`,
      )
    }

    return proposal
  } catch (error) {
    throw new Error(errorMessage(error, config.provider))
  }
}

export function getServerAiProvider(providerOverride?: string): AiProvider {
  const config = getServerAiConfig(providerOverride)
  if (config.provider === 'claude') return new ClaudeProvider()
  if (config.provider === 'gemini') return new GeminiProvider()
  if (config.provider === 'openai') return new OpenAiProvider()
  throw new Error('No live AI provider selected.')
}