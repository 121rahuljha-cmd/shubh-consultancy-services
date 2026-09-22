import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Search Console', robots: { index: false, follow: false } }

export default function SearchConsolePage() {
  const connected = Boolean(process.env.GSC_SITE_URL && process.env.GSC_SERVICE_ACCOUNT_JSON)

  return (
    <main className="min-h-screen bg-surface px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl rounded-xl border border-border bg-background p-6">
        <p className="eyebrow">Admin / SEO / Search Console</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-navy">Google Search Console</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          API data is only shown when the server has actual Google Search Console credentials configured. Local SEO audit findings are kept separate from external GSC metrics.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">API data</p>
            <p className="mt-2 text-lg font-bold text-navy">{connected ? 'Connected' : 'NOT CONNECTED'}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Local SEO audit</p>
            <p className="mt-2 text-lg font-bold text-navy">Available</p>
          </div>
        </div>

        {connected ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Search Console is configured on the server. URL inspection, sitemap status, indexing coverage, and query/date filters can be surfaced when the API returns data.
          </div>
        ) : (
          <div className="mt-6 rounded-lg bg-amber-100 p-4 text-sm font-semibold text-amber-900">
            NOT CONNECTED
          </div>
        )}

        <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-navy">No Search Console data available for this property/date range.</p>
          <p className="mt-2">No impressions, clicks, CTR, rankings, or query metrics are fabricated. Only actual API responses can populate this dashboard.</p>
        </div>
      </div>
    </main>
  )
}
