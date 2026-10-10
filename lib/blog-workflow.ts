import 'server-only'

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type BlogWorkflowStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'UNPUBLISHED' | 'CHANGES_REQUESTED' | 'ARCHIVED'
export type BlogWorkflowAction = 'submit' | 'approve' | 'request-changes' | 'publish' | 'unpublish' | 'archive' | 'restore'

export type BlogWorkflowTransition = {
  from: BlogWorkflowStatus
  to: BlogWorkflowStatus
  allowed: boolean
}

export const blogWorkflowTransitions: Record<BlogWorkflowAction, BlogWorkflowTransition[]> = {
  submit: [{ from: 'DRAFT', to: 'PENDING_APPROVAL', allowed: true }],
  approve: [{ from: 'PENDING_APPROVAL', to: 'APPROVED', allowed: true }],
  'request-changes': [{ from: 'PENDING_APPROVAL', to: 'CHANGES_REQUESTED', allowed: true }],
  publish: [{ from: 'APPROVED', to: 'PUBLISHED', allowed: true }],
  unpublish: [{ from: 'PUBLISHED', to: 'UNPUBLISHED', allowed: true }],
  archive: [{ from: 'UNPUBLISHED', to: 'ARCHIVED', allowed: true }, { from: 'PUBLISHED', to: 'ARCHIVED', allowed: true }],
  restore: [{ from: 'ARCHIVED', to: 'DRAFT', allowed: true }],
}

export function getBlogWorkflowTransition(action: BlogWorkflowAction, currentStatus: BlogWorkflowStatus) {
  return blogWorkflowTransitions[action].find((transition) => transition.from === currentStatus && transition.allowed)
}

export function assertBlogWorkflowTransition(action: BlogWorkflowAction, currentStatus: BlogWorkflowStatus) {
  if (!getBlogWorkflowTransition(action, currentStatus)) throw new Error(`Cannot ${action} a blog in ${currentStatus} status.`)
}

export async function transitionBlog(
  id: string,
  action: BlogWorkflowAction,
  actorId: string,
  data: { reason?: string; content?: unknown; title?: string } = {},
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.blogPost.findUnique({ where: { id } })
    if (!current) throw new Error('Blog not found.')
    assertBlogWorkflowTransition(action, current.status as BlogWorkflowStatus)

    const to = {
      submit: 'PENDING_APPROVAL',
      approve: 'APPROVED',
      'request-changes': 'CHANGES_REQUESTED',
      publish: 'PUBLISHED',
      unpublish: 'UNPUBLISHED',
      archive: 'ARCHIVED',
      restore: 'DRAFT',
    }[action] as BlogWorkflowStatus

    const now = new Date()
    const nextStatus = action === 'publish' ? 'PUBLISHED' : action === 'unpublish' ? 'UNPUBLISHED' : to
    const publishedAt = action === 'publish' ? now : action === 'unpublish' ? null : current.publishedAt
    const lastPublishedAt = action === 'publish' ? now : current.lastPublishedAt
    const archivedAt = action === 'archive' ? now : action === 'restore' ? null : current.archivedAt
    const version = action === 'publish' || action === 'unpublish' || action === 'approve' ? current.version + 1 : current.version

    const updated = await tx.blogPost.update({
      where: { id },
      data: {
        status: nextStatus,
        version,
        updatedAt: now,
        updatedBy: actorId,
        publishedAt,
        lastPublishedAt,
        archivedAt,
        approvedBy: action === 'approve' ? actorId : current.approvedBy,
        publishedBy: action === 'publish' ? actorId : current.publishedBy,
        approvalReason: action === 'submit' ? data.reason || null : current.approvalReason,
        rejectionReason: action === 'request-changes' ? data.reason || null : current.rejectionReason,
      },
    })

    const revisionData: Prisma.BlogRevisionCreateInput = {
      blogPost: { connect: { id } },
      version,
      content: (data.content ?? current.content) as Prisma.InputJsonValue,
      changedBy: actorId,
      status: nextStatus,
      changeType: action.toUpperCase().replace('-', '_'),
      createdAt: now,
    }
    await tx.blogRevision.create({ data: revisionData })
    return updated
  })
}

export async function getBlogWorkflowHistory(blogId: string) {
  return prisma.blogRevision.findMany({ where: { blogPostId: blogId }, orderBy: { createdAt: 'desc' } })
}

export async function getBlogWorkflow(blogId: string) {
  return prisma.blogPost.findUnique({ where: { id: blogId }, include: { revisions: { orderBy: { createdAt: 'desc' }, take: 20 } } })
}
