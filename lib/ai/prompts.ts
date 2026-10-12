import type { ServiceBuilderRecord } from '@/lib/service-builder'
import type { SeoResearchRecord } from '@/lib/seo-research'

export type AiContext = { service: string; pageType?: string; state?: string; city?: string; location?: string; primaryKeyword: string; secondaryKeywords: string; searchIntent?: string; targetAudience?: string; tone?: string; contentLength?: string; specialInstructions?: string; existingContent: string; competitorResearch?: string; research?: SeoResearchRecord }
export type AiAction = 'complete-page' | 'section' | 'rewrite' | 'seo' | 'faqs' | 'process' | 'benefits' | 'documents' | 'local-seo' | 'content-gap' | 'entities' | 'internal-links'
export function contextFromRecord(record: ServiceBuilderRecord): AiContext { return { service: record.serviceName, pageType: 'service', primaryKeyword: record.seo.primaryKeyword, secondaryKeywords: record.seo.secondaryKeywords, existingContent: [record.shortDescription, record.hero.description, record.about.description].join('\n'), targetAudience: 'Indian business owners', searchIntent: 'Commercial', tone: 'Professional and clear', contentLength: 'Standard' } }
const guardrails = 'Write original, factual Indian English. Preserve supplied facts. Do not invent approvals, guarantees, awards, reviews, statistics, credentials, prices, or legal requirements. Mark uncertain items for manual verification. Do not copy competitor wording.'
function researchContext(context: AiContext) { if (!context.research) return 'SEO research: Not available. Do not infer missing research.'; const research = context.research; return `SEO research: intent=${research.searchIntent}; secondary intent=${research.secondaryIntent.join(', ')}; topics=${research.topicMap.supportingTopics.join(', ')}; entities=${research.entityMap.primary.join(', ')}; gaps=${research.contentGaps.map((gap) => gap.topic).join(', ')}; local guidance=${research.localSeo.localContentOpportunities.join(', ')}; internal links=${research.internalLinkOpportunities.map((link) => `${link.targetPage} (${link.anchorSuggestion})`).join(', ')}; trust=${research.eeatRequirements.join(', ')}; answer-engine guidance=${research.aiSearchOptimization.answerBlockRecommendations.join(', ')}; blueprint headings=${research.contentBlueprint.h2s.join(', ')}.` }
export function buildPagePrompt(context: AiContext) {
  const isBlog = /blog|article/i.test(context.pageType || '')
  const contentType = isBlog ? 'blog article' : 'service/information page'
  const formatInstruction = isBlog
    ? 'Create a useful informational article, not a sales landing page. Include an introduction, descriptive H2/H3 sections, practical steps/checklists where relevant, conclusion and FAQs.'
    : 'Create a complete service/information page with H1, hero, overview, relevant service details, eligibility, documents, process, benefits, FAQs, CTA and justified local information.'
  const fixedCmsContract = [
    'FIXED CMS OUTPUT CONTRACT: follow this same contract for every page generation; user commands may specify topic/location/quantity but must not remove these requirements.',
    'Return one valid JSON object only, without markdown fences or commentary.',
    'Map output to the existing CMS editor and its fields. Do not rename, remove, or invent a replacement CMS schema.',
    'Basic: title/pageTitle, slug, shortDescription, draft status.',
    'Intent: searchIntent, secondaryIntent, targetAudience, topicMap, entityMap, contentGaps, contentBlueprint.',
    'SEO: primaryKeyword, secondaryKeywords, longTailKeywords, seoTitle, metaDescription, canonicalUrl, robotsIndex, robotsFollow, ogTitle, ogDescription, ogImage, keywordVariations.',
    'Content: H1, introduction/hero description, ordered H2/H3 headings, complete original body, conclusion and answer-first passages for AI search.',
    'Service: overview, eligibility, service types, required/optional documents, application steps, verified fees/timelines, benefits, supplied pricing and CTA.',
    'Location: state, city, meaningful local content opportunities and verified local requirements; never create thin doorway pages.',
    'Links: internalLinkOpportunities with targetPage and natural anchorSuggestion; only use existing verified pages and URLs.',
    'FAQ: useful questions and accurate answers. Recommend FAQ schema only if visible FAQ content and implementation support it.',
    'Media: featuredImageUrl, altText, title, caption, description. Never fabricate image URLs; if unknown, return empty URL and a suggested alt text.',
    'Schema: only relevant Organization, BreadcrumbList, Service or Article structured data; no fabricated reviews or ratings.',
    'Sitemap: sitemap inclusion and canonical/indexability recommendations. Generated records remain drafts until a human approves them.',
    'Audit: missingFields, verificationWarnings, duplication/cannibalization risks and readiness notes.',
    'Unknown facts must be empty or marked VERIFY FACT. Never fabricate legal requirements, official fees, processing times, approvals, credentials, rankings, search metrics or citations.',
    'Draft safety: never publish, overwrite live pages, or change existing records. Return a reviewable draft only.',
  ].join(' ')
  return `Create a structured, people-first ${contentType} draft for ${context.service}. ${formatInstruction}
Topic/service: ${context.service}. Page type: ${context.pageType || 'service'}. State: ${context.state || 'Not supplied'}. City/location: ${context.city || context.location || 'Not supplied'}. Primary keyword: ${context.primaryKeyword}. Secondary keywords: ${context.secondaryKeywords}. Search intent: ${context.searchIntent || 'Classify from topic; mark uncertain assumptions'}. Audience: ${context.targetAudience || 'Indian business owners and applicants'}. Tone: ${context.tone || 'Professional, clear Indian English'}. Length: ${context.contentLength || 'Detailed but concise'}. User command/additional instructions: ${context.specialInstructions || 'Follow the fixed CMS output contract'}.
Existing content: ${context.existingContent || 'No existing content supplied.'}
${researchContext(context)}
SEO requirements: satisfy intent; use keywords naturally; cover relevant topics and entities; answer likely user questions directly; add trustworthy internal-link suggestions, FAQs, trust signals and AI-search-friendly answer blocks; avoid keyword stuffing and cannibalization.
${fixedCmsContract}
${guardrails} For uncertain legal, regulatory, pricing, timeline, local or official claims, mark VERIFY FACT. Return JSON compatible with the current CMS integration and allowlisted ServiceBuilderRecord structure.`
}
export function buildSectionPrompt(context: AiContext, section: string) { return `Create only the ${section} section for ${context.service}. Focus keyword: ${context.primaryKeyword}. ${guardrails} Do not modify unrelated sections.` }
export function buildFaqPrompt(context: AiContext) { return buildSectionPrompt(context, 'FAQ questions and answers') }
export function buildSeoPrompt(context: AiContext) { return `Suggest SEO title, meta description, slug, primary keyword, secondary keywords, canonical, robots, OG fields and image ALT recommendations for ${context.service}. ${researchContext(context)} ${guardrails} Keep metadata natural and aligned with intent.` }
export function buildLocalSeoPrompt(context: AiContext) { return `Create genuinely local, non-doorway-page guidance for ${context.service} in ${context.location || 'the selected location'}. ${guardrails} If no meaningful local distinction is known, say it requires manual verification.` }
export function buildContentGapPrompt(context: AiContext) { return `Review this ${context.service} content and list missing topics, entities, questions, trust signals and internal links: ${context.existingContent}. ${guardrails}` }
export function buildResearchPrompt(context: AiContext) { return `Research the SEO and content requirements for ${context.service}${context.location ? ` in ${context.location}` : ''}. Return qualitative keywords, intent, topics, entities, gaps, local guidance, internal links and a content blueprint. Never invent metrics or official facts. ${guardrails}` }
export function buildKeywordResearchPrompt(context: AiContext) { return `Build keyword groups for ${context.service}: primary, supporting, long-tail, questions, commercial, informational, local and semantic terms. Do not claim volume, difficulty or rankings. ${guardrails}` }
export function buildIntentPrompt(context: AiContext) { return `Classify search intent for ${context.service}${context.location ? ` in ${context.location}` : ''} with a primary intent, secondary intents and explanation. This is qualitative research only. ${guardrails}` }
export function buildTopicMapPrompt(context: AiContext) { return `Build a core topic, supporting topics and user questions for ${context.service}. ${guardrails}` }
export function buildEntityMapPrompt(context: AiContext) { return `Build an entity map for ${context.service}. Separate primary, regulatory, business, document, process and location entities. Mark uncertain facts for verification. ${guardrails}` }
export function buildGapAnalysisPrompt(context: AiContext) { return buildContentGapPrompt(context) }
export function buildCompetitorGapPrompt(context: AiContext) { return `Analyze only manually supplied competitor notes for ${context.service}. Recommend original topic, FAQ, entity, local, trust and conversion opportunities. Never scrape or copy wording. ${guardrails}` }
export function buildInternalLinkPrompt(context: AiContext) { return `Suggest internal links for ${context.service} using existing verified pages only. Identify orphan and irrelevant-link risks. ${guardrails}` }
export function buildCannibalizationPrompt(context: AiContext) { return `Compare service pages for keyword, topic, location and intent overlap for ${context.service}. Return warnings and recommendations only. ${guardrails}` }
export function buildContentBlueprintPrompt(context: AiContext) { return `Create a complete content blueprint for ${context.service}, including headings, entities, FAQs, links, sources, trust, local, schema and answer-engine recommendations. ${guardrails}` }
export function buildCustomBlocksPrompt(context: AiContext, action: string) { return `For ${context.service}, create a structured list of original ${action} recommendations. Return JSON only in the form {"items":[{"title":"...","description":"..."}]}. Do not invent regulatory, pricing, official, local or competitor facts; mark uncertain items with VERIFY FACT. ${guardrails}` }
export function buildContentGenerationPrompt(context: AiContext) { return buildPagePrompt(context) }
export function promptFor(action: AiAction, context: AiContext, section = 'the selected section') { if (action === 'complete-page') return buildPagePrompt(context); if (action === 'seo') return buildSeoPrompt(context); if (action === 'faqs') return buildFaqPrompt(context); if (action === 'local-seo') return buildLocalSeoPrompt(context); if (action === 'content-gap' || action === 'entities' || action === 'internal-links') return buildCustomBlocksPrompt(context, action); return buildSectionPrompt(context, action === 'section' ? section : action) }
