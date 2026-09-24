import type { Metadata } from 'next'
import Link from 'next/link'

import { listPublishedBlogs } from '@/lib/database-repository'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights and guidance from Shubh Consultancy Services.',
  alternates: { canonical: '/blog' },
  robots: { index: true, follow: true },
}

export default async function BlogIndexPage() {
  const posts = await listPublishedBlogs()

  return (
    <main className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="mb-10 max-w-3xl">
          <p className="eyebrow">Insights</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navy md:text-5xl">Blog</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Practical guidance for founders, startups, and growing businesses.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
            No published blog posts are available yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const summary: string =
                typeof post.content === 'string'
                  ? post.content
                  : typeof post.content === 'object' && post.content && 'summary' in post.content && typeof (post.content as Record<string, unknown>).summary === 'string'
                    ? String((post.content as Record<string, unknown>).summary)
                    : 'Read the latest article and insights from our team.'

              return (
                <article key={post.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                    {new Date(post.publishedAt || post.updatedAt || Date.now()).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <h2 className="mt-3 font-serif text-2xl font-bold text-navy">{post.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{summary}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-5 inline-flex items-center text-sm font-semibold text-brand hover:underline"
                  >
                    Read article
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
