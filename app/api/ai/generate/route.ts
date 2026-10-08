import { NextResponse } from 'next/server'
import {
  generateServerSection,
  getServerAiConfig,
  getServerAiProvider,
} from '@/lib/ai/server-boundary'
import type { AiAction, AiContext } from '@/lib/ai/prompts'
import { validateCmsSection, type SectionAiContext } from '@/lib/cms-sections'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth-boundary'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const actions: AiAction[] = [
  'complete-page',
  'section',
  'rewrite',
  'seo',
  'faqs',
  'process',
  'benefits',
  'documents',
  'local-seo',
  'content-gap',
  'entities',
  'internal-links',
]

const text = (value: unknown, max: number) =>
  typeof value === 'string' && value.length <= max

const failure = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

async function knowledgeContext(service: string, location?: string) {
  if (!process.env.DATABASE_URL) return ''

  try {
    const term = `${service} ${location || ''}`.trim()

    const rows = await prisma.$queryRaw<
      { title: string; fact: string; source: string }[]
    >`
      SELECT "title", "fact", "source"
      FROM "KnowledgeRecord"
      WHERE "status" = 'ACTIVE'
        AND (
          "title" ILIKE ${`%${term}%`}
          OR "category" ILIKE ${`%${service}%`}
          OR "content" ILIKE ${`%${service}%`}
        )
      ORDER BY "priority" DESC, "updatedAt" DESC
      LIMIT 8
    `

    return rows
      .map(
        (row) =>
          `[APPROVED KNOWLEDGE] ${row.title}: ${row.fact} (Source: ${row.source})`,
      )
      .join('\n')
      .slice(0, 6000)
  } catch {
    return ''
  }
}

async function logAi(
  action: string,
  provider: string,
  success: boolean,
  inputSize: number,
  outputSize: number,
) {
  if (!process.env.DATABASE_URL) return

  try {
    const session = await getServerSession()

    await prisma.activityLog.create({
      data: {
        userId: session?.userId,
        action: `ai.${action}.${success ? 'success' : 'failure'}`,
        entity: 'ai_generation',
        metadata: {
          provider,
          model:
            process.env.AI_MODEL ||
            (provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'),
          inputSize,
          outputSize,
        },
      },
    })
  } catch {
    // AI logging must not break generation.
  }
}

export function GET() {
  const config = getServerAiConfig()

  return NextResponse.json({
    provider: config.provider,
    model: config.model,
    configured: config.configured,
  })
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  const rateLimitKey = `ai:${ip}`

  if (!checkRateLimit(rateLimitKey, { max: 20, windowMs: 60_000 })) {
    const headers = rateLimitHeaders(rateLimitKey, {
      max: 20,
      windowMs: 60_000,
    })

    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please wait a minute and try again.',
      },
      {
        status: 429,
        headers,
      },
    )
  }

  let body: {
    action?: unknown
    context?: Partial<AiContext>
    section?: unknown
    sectionContext?: SectionAiContext
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: 'Request body must be valid JSON.',
      },
      {
        status: 400,
      },
    )
  }

  /*
   * CMS section editing
   */
  if (body.action === 'section-edit') {
    const input = body.sectionContext

    if (
      !input ||
      !input.current ||
      !validateCmsSection(input.current, input.current) ||
      typeof input.service !== 'string' ||
      typeof input.pageType !== 'string' ||
      typeof input.instruction !== 'string' ||
      input.instruction.length > 2000 ||
      !Array.isArray(input.surrounding)
    ) {
      return failure(
        'Section AI context is invalid.',
        'VALIDATION_FAILED',
        400,
      )
    }

    const config = getServerAiConfig()

    if (!['openai', 'gemini'].includes(config.provider)) {
      return failure(
        'No supported AI provider is selected.',
        'PROVIDER_NOT_SELECTED',
        400,
      )
    }

    if (!config.configured) {
      return failure(
        `${config.provider} API key is not configured.`,
        'API_KEY_MISSING',
        503,
      )
    }

    try {
      const result = await generateServerSection(input)

      await logAi(
        'section-edit',
        config.provider,
        true,
        JSON.stringify(input).length,
        JSON.stringify(result).length,
      )

      return NextResponse.json(result)
    } catch (error) {
      await logAi(
        'section-edit',
        config.provider,
        false,
        JSON.stringify(input).length,
        0,
      )

      return failure(
        error instanceof Error
          ? error.message
          : 'AI provider failure.',
        error instanceof Error &&
          error.message.toLowerCase().includes('rate limit')
          ? 'RATE_LIMITED'
          : 'PROVIDER_ERROR',
        502,
      )
    }
  }

  /*
   * Standard AI generation
   */
  if (!actions.includes(body.action as AiAction)) {
    return failure(
      'Unsupported AI action.',
      'UNSUPPORTED_ACTION',
      400,
    )
  }

  const input = body.context || {}

  if (
    !text(input.service, 200) ||
    !text(input.primaryKeyword, 200) ||
    !text(input.secondaryKeywords, 2000) ||
    !text(input.existingContent, 12000) ||
    (input.state !== undefined &&
      !text(input.state, 120)) ||
    (input.city !== undefined &&
      !text(input.city, 120)) ||
    (input.location !== undefined &&
      !text(input.location, 200)) ||
    (input.specialInstructions !== undefined &&
      !text(input.specialInstructions, 2000))
  ) {
    return failure(
      'AI context contains invalid or oversized fields.',
      'VALIDATION_FAILED',
      400,
    )
  }

  const knowledge = await knowledgeContext(
    input.service as string,
    input.location as string | undefined,
  )

  const enrichedInput = {
    ...input,
    specialInstructions: `${
      input.specialInstructions || ''
    }\n${
      knowledge
        ? `Use only these approved knowledge facts for factual claims:\n${knowledge}`
        : 'No approved knowledge record matched. Mark uncertain factual claims for review.'
    }`,
  }

  const config = getServerAiConfig()

  if (!['openai', 'gemini'].includes(config.provider)) {
    return failure(
      'No supported AI provider is selected.',
      'PROVIDER_NOT_SELECTED',
      400,
    )
  }

  if (!config.configured) {
    return failure(
      `${config.provider} API key is not configured.`,
      'API_KEY_MISSING',
      503,
    )
  }

  try {
    const suggestion = await getServerAiProvider().generate(
      body.action as AiAction,
      enrichedInput as AiContext,
      typeof body.section === 'string'
        ? body.section.slice(0, 120)
        : undefined,
    )

    await logAi(
      body.action as string,
      config.provider,
      true,
      JSON.stringify(enrichedInput).length,
      JSON.stringify(suggestion).length,
    )

    return NextResponse.json(suggestion)
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : 'AI provider failure.',
      error instanceof Error &&
        error.message.toLowerCase().includes('rate limit')
        ? 'RATE_LIMITED'
        : 'PROVIDER_ERROR',
      502,
    )
  }
}