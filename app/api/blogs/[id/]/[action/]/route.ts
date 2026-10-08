import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-boundary'
import { assertBlogWorkflowTransition, getBlogWorkflowTransition, transitionBlog, type BlogWorkflowAction } from '@/lib/blog-workflow'

const actions = new Set<BlogWorkflowAction>(['submit', 'approve', 'request-changes', 'publish', 'unpublish', 'archive', 'restore'])

export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: BlogWorkflowAction }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const { id, action } = await params
  if (!actions.has(action)) return NextResponse.json({ error: 'Unknown workflow action.' }, { status: 400 })

  try {
    const body = await request.json().catch(() => ({})) as { reason?: string; content?: unknown }
    const blog = await transitionBlog(id, action, session.userId, body)
    return NextResponse.json({ blog })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blog workflow could not be completed.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export function GET(_request: Request, { params }: { params: Promise<{ id: string; action: BlogWorkflowAction }> }) {
  return NextResponse.json({ actions: Array.from(actions), error: 'Use POST for workflow actions.' })
}

export const __workflow = { actions, getTransition: getBlogWorkflowTransition, assertTransition: assertBlogWorkflowTransition }
