import type { AiGenerationJobRecord } from '@/lib/cms-model'
import { createGenerationPlan, qualityCheck, type GenerationPlan } from '@/lib/page-scale'
import type { ServiceBuilderRecord } from '@/lib/service-builder'

export type GenerationContext = { service: string; location: string; existingContent: ServiceBuilderRecord; researchAvailable: boolean; verifiedLocationFacts: string[] }
export type GenerationResult = { status: 'completed' | 'failed'; changes?: Partial<ServiceBuilderRecord>; issues: ReturnType<typeof qualityCheck>['issues']; errorMessage?: string }

export function planBatchGeneration(action: string, pageIds: string[], existingJobs: Pick<AiGenerationJobRecord, 'servicePageId' | 'action' | 'status' | 'inputHash'>[], batchSize = 25): GenerationPlan {
  return createGenerationPlan(action, pageIds, existingJobs, Math.min(100, Math.max(1, batchSize)))
}

export function validateGeneratedDraft(record: ServiceBuilderRecord, context: Pick<GenerationContext, 'researchAvailable'>) {
  const report = qualityCheck(record, context.researchAvailable)
  return { ...report, canComplete: !report.issues.some((issue) => issue.severity === 'error') }
}

export function canRetryJob(job: Pick<AiGenerationJobRecord, 'status' | 'attempts' | 'maxAttempts'>) {
  return job.status === 'failed' && job.attempts < job.maxAttempts
}

export function canReplaceAcceptedContent(sectionWasEdited: boolean, explicitConfirmation: boolean) {
  return !sectionWasEdited || explicitConfirmation
}
