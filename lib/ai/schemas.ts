import type { BuilderDocument, BuilderFaq, BuilderImage, BuilderItem, BuilderProcessStep, BuilderSeo, ServiceBuilderRecord } from '@/lib/service-builder'

export type AiGeneratedSeo = Pick<BuilderSeo, 'seoTitle' | 'metaDescription' | 'canonicalUrl' | 'robots' | 'ogTitle' | 'ogDescription'> & { slugSuggestion: string; primaryKeyword: string; secondaryKeywords: string[]; imageAltRecommendations: string[] }
export type AiGeneratedAbout = { heading: string; description: string; imageAltRecommendation?: string }
export type AiGeneratedBenefits = { items: Pick<BuilderItem, 'title' | 'description'>[] }
export type AiGeneratedProcess = { items: Pick<BuilderProcessStep, 'title' | 'description'>[] }
export type AiGeneratedDocuments = { items: Pick<BuilderDocument, 'title' | 'description' | 'required'>[] }
export type AiGeneratedFaqs = { items: Pick<BuilderFaq, 'question' | 'answer'>[] }
export type AiGeneratedLocalSeo = { heading: string; description: string; localValue: string[]; verificationRequired: string[] }
export type AiGeneratedCustom = { items: Pick<BuilderItem, 'title' | 'description'>[] }
export type AiGeneratedCompletePage = { hero?: { h1: string; description: string }; about?: AiGeneratedAbout; benefits?: AiGeneratedBenefits; process?: AiGeneratedProcess; documents?: AiGeneratedDocuments; faqs?: AiGeneratedFaqs; localSeo?: AiGeneratedLocalSeo; seo?: AiGeneratedSeo; customBlocks?: AiGeneratedCustom }
export type AiGeneratedOutput = AiGeneratedSeo | AiGeneratedAbout | AiGeneratedBenefits | AiGeneratedProcess | AiGeneratedDocuments | AiGeneratedFaqs | AiGeneratedLocalSeo | AiGeneratedCustom | AiGeneratedCompletePage
export type AiOutputKind = 'seo' | 'about' | 'benefits' | 'process' | 'documents' | 'faqs' | 'local-seo' | 'custom' | 'complete-page'
export type ValidatedAiOutput = { kind: AiOutputKind; output: AiGeneratedOutput; warnings: string[] }

const text = (value: unknown, max = 5000): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max
const textArray = (value: unknown, maxItems = 30) => Array.isArray(value) && value.length <= maxItems && value.every((item) => text(item, 500))
const safeUrl = (value: unknown) => typeof value === 'string' && value.length <= 300 && !/^javascript:/i.test(value) && !/[<>]/.test(value)
const itemArray = (value: unknown) => Array.isArray(value) && value.length <= 30 && value.every((item) => typeof item === 'object' && item !== null && text((item as { title?: unknown }).title, 160) && text((item as { description?: unknown }).description, 2000))
const faqArray = (value: unknown) => Array.isArray(value) && value.length <= 30 && value.every((item) => typeof item === 'object' && item !== null && text((item as { question?: unknown }).question, 240) && text((item as { answer?: unknown }).answer, 2000))
const documentArray = (value: unknown) => Array.isArray(value) && value.length <= 30 && value.every((item) => typeof item === 'object' && item !== null && text((item as { title?: unknown }).title, 160) && text((item as { description?: unknown }).description, 2000) && ['required', 'optional'].includes((item as { required?: unknown }).required as string))

export function validateAiOutput(kind: AiOutputKind, value: unknown): ValidatedAiOutput | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (kind === 'seo' && text(candidate.seoTitle, 180) && text(candidate.metaDescription, 320) && text(candidate.slugSuggestion, 160) && text(candidate.primaryKeyword, 160) && textArray(candidate.secondaryKeywords) && safeUrl(candidate.canonicalUrl) && ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'].includes(candidate.robots as string) && text(candidate.ogTitle, 180) && text(candidate.ogDescription, 320) && textArray(candidate.imageAltRecommendations)) return { kind, output: candidate as unknown as AiGeneratedSeo, warnings: [] }
  if (kind === 'about' && text(candidate.heading, 180) && text(candidate.description, 5000)) return { kind, output: candidate as unknown as AiGeneratedAbout, warnings: [] }
  if (kind === 'benefits' && itemArray(candidate.items)) return { kind, output: candidate as unknown as AiGeneratedBenefits, warnings: [] }
  if (kind === 'process' && itemArray(candidate.items)) return { kind, output: candidate as unknown as AiGeneratedProcess, warnings: [] }
  if (kind === 'documents' && documentArray(candidate.items)) return { kind, output: candidate as unknown as AiGeneratedDocuments, warnings: [] }
  if (kind === 'faqs' && faqArray(candidate.items)) return { kind, output: candidate as unknown as AiGeneratedFaqs, warnings: [] }
  if (kind === 'local-seo' && text(candidate.heading, 180) && text(candidate.description, 5000) && textArray(candidate.localValue) && textArray(candidate.verificationRequired)) return { kind, output: candidate as unknown as AiGeneratedLocalSeo, warnings: ['Verify every local fact before publishing.'] }
  if (kind === 'custom' && itemArray(candidate.items)) return { kind, output: candidate as unknown as AiGeneratedCustom, warnings: ['Review every recommendation before accepting.'] }
  if (kind === 'complete-page' && Object.keys(candidate).every((key) => ['hero', 'about', 'benefits', 'process', 'documents', 'faqs', 'localSeo', 'seo', 'customBlocks'].includes(key)) && (!candidate.hero || (typeof candidate.hero === 'object' && candidate.hero !== null && text((candidate.hero as Record<string, unknown>).h1, 180) && text((candidate.hero as Record<string, unknown>).description, 3000))) && (!candidate.about || validateAiOutput('about', candidate.about)) && (!candidate.benefits || validateAiOutput('benefits', candidate.benefits)) && (!candidate.process || validateAiOutput('process', candidate.process)) && (!candidate.documents || validateAiOutput('documents', candidate.documents)) && (!candidate.faqs || validateAiOutput('faqs', candidate.faqs)) && (!candidate.localSeo || validateAiOutput('local-seo', candidate.localSeo)) && (!candidate.seo || validateAiOutput('seo', candidate.seo)) && (!candidate.customBlocks || validateAiOutput('custom', candidate.customBlocks))) return { kind, output: candidate as unknown as AiGeneratedCompletePage, warnings: ['Review every generated section before accepting.'] }
  return null
}

export function safeChangesForOutput(kind: AiOutputKind, output: AiGeneratedOutput, base?: ServiceBuilderRecord): Partial<ServiceBuilderRecord> {
  const id = () => `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  if (kind === 'seo') { const seo = output as AiGeneratedSeo; return { seo: { primaryKeyword: seo.primaryKeyword, secondaryKeywords: seo.secondaryKeywords.join(', '), seoTitle: seo.seoTitle, metaDescription: seo.metaDescription, canonicalUrl: seo.canonicalUrl, robots: seo.robots, ogTitle: seo.ogTitle, ogDescription: seo.ogDescription, ogImage: '' } } }
  if (kind === 'about') { const about = output as AiGeneratedAbout; return { about: { heading: about.heading, description: about.description, image: { image: '', altText: about.imageAltRecommendation || '', title: '', caption: '' } as BuilderImage } } }
  if (kind === 'benefits') return { benefits: (output as AiGeneratedBenefits).items.map((item, index) => ({ ...item, id: id(), icon: '', link: '', enabled: true, order: index + 1 })) }
  if (kind === 'process') return { process: (output as AiGeneratedProcess).items.map((item, index) => ({ ...item, id: id(), icon: '', link: '', enabled: true, order: index + 1 })) }
  if (kind === 'documents') return { documents: (output as AiGeneratedDocuments).items.map((item, index) => ({ ...item, id: id(), icon: '', link: '', enabled: true, order: index + 1 })) }
  if (kind === 'faqs') return { faqs: (output as AiGeneratedFaqs).items.map((item, index) => ({ ...item, id: id(), enabled: true, order: index + 1 })) }
  if (kind === 'custom') return { customBlocks: (output as AiGeneratedCustom).items.map((item, index) => ({ ...item, id: id(), icon: '', link: '', enabled: true, order: index + 1 })) }
  if (kind === 'complete-page') { const page = output as AiGeneratedCompletePage; return { ...(page.hero && base ? { hero: { ...base.hero, h1: page.hero.h1, description: page.hero.description } } : {}), ...(page.about ? safeChangesForOutput('about', page.about, base) : {}), ...(page.benefits ? safeChangesForOutput('benefits', page.benefits, base) : {}), ...(page.process ? safeChangesForOutput('process', page.process, base) : {}), ...(page.documents ? safeChangesForOutput('documents', page.documents, base) : {}), ...(page.faqs ? safeChangesForOutput('faqs', page.faqs, base) : {}), ...(page.seo ? safeChangesForOutput('seo', page.seo, base) : {}), ...(page.customBlocks ? safeChangesForOutput('custom', page.customBlocks, base) : {}) } }
  return {}
}