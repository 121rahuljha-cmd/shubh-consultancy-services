import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bing Webmaster', robots: { index: false, follow: false } }

export default function BingPage() {
  const connected = Boolean(process.env.BING_WEBMASTER_API_KEY && process.env.BING_SITE_URL)

  return (
    <main className="min-h-screen bg-surface px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl rounded-xl border border-border bg-background p-6">
        <p className="eyebrow">Admin / SEO / Bing</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-navy">Bing Webmaster and IndexNow</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Bing Webmaster and IndexNow only become active when the required server-side credentials are configured. The dashboard reports API state honestly and avoids fake metrics.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Bing site config</p>
            <p className="mt-2 text-lg font-bold text-navy">{connected ? 'Connected' : 'Not Connected'}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sitemap</p>
            <p className="mt-2 text-lg font-bold text-navy">{connected ? 'Ready' : 'Configuration Required'}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">IndexNow</p>
            <p className="mt-2 text-lg font-bold text-navy">{Boolean(process.env.INDEXNOW_KEY && process.env.INDEXNOW_HOST) ? 'Configured' : 'Not Connected'}</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-amber-100 p-4 text-sm font-semibold text-amber-900">
          {connected ? 'Connected' : 'NOT CONNECTED'}
        </div>
      </div>
    </main>
  )
}
