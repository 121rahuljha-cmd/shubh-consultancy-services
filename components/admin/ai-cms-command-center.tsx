'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getBuilderRecords, type ServiceBuilderRecord } from '@/lib/service-builder'
import { cmsPageFromAi } from '@/lib/ai/cms-integration'
import { generateWithServerAi, type AiSuggestion } from '@/lib/ai/provider'

type Kind = 'service' | 'blog'
type Target = { id: string; title: string; slug: string; location: string; kind: Kind; status: 'planned' | 'saved' | 'failed'; error?: string }
const locations = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry']
const topics = ['Eligibility and application guide','Documents checklist','Application process explained','Fees and charges guide','Renewal and compliance guide','Common mistakes to avoid','Online application guide','Business owner checklist','Frequently asked questions','Requirements and preparation guide','Application status and next steps','Benefits and limitations explained','Compliance timeline guide','How to prepare an application','Practical filing checklist']
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const obj = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const str = (value: unknown) => typeof value === 'string' ? value : ''
const waitForAiSlot = () => new Promise<void>((resolve) => window.setTimeout(resolve, 3200))

function makePlan(command: string, name: string, destination: 'service' | 'blog' | 'both'): Target[] {
  const match = command.match(/\b(\d{1,3})\s*(?:seo\s*)?(?:landing\s*)?(?:pages?|blogs?|articles?|posts?)\b/i)
  const count = Math.max(1, Math.min(100, Number(match?.[1] || 10)))
  const local = /\b(state|states|ut|uts|union territor|location|city|cities|state-wise|state wise|across india|india ke har)\b/i.test(command)
  const types: Kind[] = destination === 'both' ? ['service', 'blog'] : [destination]
  return types.flatMap((kind) => Array.from({ length: count }, (_, i) => {
    const location = local && i < locations.length ? locations[i] : ''
    const title = location ? name + ' in ' + location : name + ': ' + topics[i % topics.length] + (i >= topics.length ? ' (' + (i + 1) + ')' : '')
    const slug = slugify(title)
    return { id: kind + '-' + i + '-' + slug, title, slug, location, kind, status: 'planned' as const }
  }))
}

function contentFrom(suggestion: AiSuggestion, title: string) {
  const changes = suggestion.changes as unknown as Record<string, unknown>
  const hero = obj(changes.hero), about = obj(changes.about)
  const list = (key: string) => Array.isArray(changes[key]) ? changes[key] as Record<string, unknown>[] : []
  const benefits = list('benefits'), steps = list('process'), faqs = list('faqs')
  return [
    '# ' + (str(hero.h1) || title), str(hero.description),
    '## Overview\n\n' + (str(about.description) || 'Review and complete this draft before publishing.'),
    benefits.length ? '## Key points\n\n' + benefits.map((x) => '### ' + str(x.title) + '\n\n' + str(x.description)).join('\n\n') : '',
    steps.length ? '## Process\n\n' + steps.map((x, i) => String(i + 1) + '. **' + str(x.title) + '** — ' + str(x.description)).join('\n') : '',
    faqs.length ? '## Frequently asked questions\n\n' + faqs.map((x) => '### ' + str(x.question) + '\n\n' + str(x.answer)).join('\n\n') : '',
    '> Review regulatory, fee and timeline claims before publishing.'
  ].filter(Boolean).join('\n\n')
}

export function AiCmsCommandCenter() {
  const [command, setCommand] = useState('Create 10 SEO drafts for Food Licence. Include unique SEO titles, meta descriptions, headings and FAQs. Save as drafts only.')
  const [serviceSlug, setServiceSlug] = useState('fssai-food-licence')
  const [destination, setDestination] = useState<'service' | 'blog' | 'both'>('both')
  const [records, setRecords] = useState<ServiceBuilderRecord[]>([])
  const [plan, setPlan] = useState<Target[]>([])
  const [approved, setApproved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, batch: 0 })
  const [notice, setNotice] = useState('')
  const selected = useMemo(() => records.find((x) => x.serviceSlug === serviceSlug) || records[0], [records, serviceSlug])
  const saved = plan.filter((x) => x.status === 'saved').length
  const failed = plan.filter((x) => x.status === 'failed').length
  const loadRecords = () => { const next = getBuilderRecords(); setRecords(next); if (next.length && !next.some((x) => x.serviceSlug === serviceSlug)) setServiceSlug(next[0].serviceSlug); return next }

  const planCommand = () => {
    const all = records.length ? records : loadRecords()
    const base = all.find((x) => x.serviceSlug === serviceSlug) || all[0]
    const serviceName = base?.serviceName || command.match(/(?:for|about|on)\s+(.+?)(?:[.,;]|$)/i)?.[1] || 'Food Licence'
    const next = makePlan(command, serviceName, destination)
    setPlan(next); setApproved(false)
    setNotice('Plan ready: ' + next.length + ' draft item(s). Nothing has been generated or saved yet. Review titles and slugs, then approve.')
  }

  const generateOne = async (item: Target, record: ServiceBuilderRecord) => {
    const keyword = item.location ? record.serviceName + ' ' + item.location : item.title
    const suggestion = await generateWithServerAi('complete-page', {
      service: item.title, pageType: item.kind === 'blog' ? 'blog article' : 'service landing page',
      state: item.location, location: item.location, primaryKeyword: keyword,
      secondaryKeywords: record.serviceName + ', application process, documents required, eligibility, FAQs',
      searchIntent: item.kind === 'blog' ? 'informational' : 'commercial', targetAudience: 'Indian business owners and applicants',
      tone: 'Professional Indian English', contentLength: 'Detailed but concise',
      specialInstructions: command + '\nTitle: ' + item.title + '\nSlug: ' + item.slug + '\nContent type: ' + item.kind + '\nLocation: ' + (item.location || 'Not specified') + '\nPreserve every supplied SEO field, heading and topic. Do not invent laws, prices, timelines or approvals; mark uncertain claims VERIFY FACT. Avoid doorway/near-duplicate content. Draft only; never publish.',
      existingContent: [record.shortDescription, record.hero.description, record.about.description].join('\n\n'),
    })
    const changes = suggestion.changes as Record<string, unknown>
    const seo = obj(changes.seo), hero = obj(changes.hero)
    const content = contentFrom(suggestion, item.title)
    if (item.kind === 'blog') {
      const response = await fetch('/api/blogs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: item.title, slug: item.slug, content, status: 'draft', excerpt: str(hero.description).slice(0, 300),
        author: 'Shubh Consultancy Services', category: record.serviceName, tags: [record.serviceName, item.location, 'SEO draft'].filter(Boolean),
        seo: { primaryKeyword: str(seo.primaryKeyword) || keyword, secondaryKeywords: str(seo.secondaryKeywords), seoTitle: str(seo.seoTitle) || item.title, metaDescription: str(seo.metaDescription), canonicalUrl: str(seo.canonicalUrl), robotsIndex: false, robotsFollow: true, ogTitle: str(seo.ogTitle) || item.title, ogDescription: str(seo.ogDescription) || str(seo.metaDescription), intent: { searchIntent: 'informational', targetAudience: 'Indian business owners', targetLocation: item.location, relatedTopics: '', relatedEntities: record.serviceName }, schema: { article: 'auto', breadcrumbList: 'auto', faqPage: 'auto', organization: 'auto' }, faqs: Array.isArray(changes.faqs) ? changes.faqs : [] },
        sections: [],
      }) })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Blog draft save failed (' + response.status + ').')
      return
    }
    const converted = cmsPageFromAi(record, suggestion, { pageType: 'service', searchIntent: 'commercial', targetAudience: 'Indian business owners' })
    const page = { ...converted.page, id: 'ai-batch-' + item.slug + '-' + crypto.randomUUID(), title: item.title, slug: item.slug, status: 'draft' as const, generationStatus: 'needs_review' as const, generationError: 'AI-generated draft: verify factual claims and SEO before publishing.', serviceId: record.serviceSlug, targetLocation: item.location, primaryKeyword: str(seo.primaryKeyword) || keyword, secondaryKeywords: str(seo.secondaryKeywords), seoTitle: str(seo.seoTitle) || item.title, metaDescription: str(seo.metaDescription), canonicalUrl: str(seo.canonicalUrl), robotsIndex: false, robotsFollow: true, h1: str(hero.h1) || item.title, introduction: str(hero.description), mainContent: content, blocks: [{ id: 'block-' + item.slug, type: 'heading-content' as const, title: item.title, content, settings: {}, displayOrder: 1, status: 'active' as const }] }
    const response = await fetch('/api/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(page) })
    const result = await response.json() as { error?: string }
    if (!response.ok) throw new Error(result.error || 'Service page draft save failed (' + response.status + ').')
  }

  const run = async (retry: boolean) => {
    const record = selected || (records.length ? records[0] : loadRecords()[0])
    if (!record) { setNotice('No Service Builder record is available. Create or select a service first.'); return }
    if (!approved) { setNotice('Approve the reviewed plan before generation.'); return }
    const pending = plan.filter((x) => retry ? x.status === 'failed' : x.status === 'planned')
    if (!pending.length) { setNotice('No pending items to process.'); return }
    setBusy(true); setNotice(''); setProgress({ done: 0, total: pending.length, batch: 1 })
    let done = 0
    try {
      for (let start = 0; start < pending.length; start += 10) {
        const batch = pending.slice(start, start + 10)
        setProgress({ done, total: pending.length, batch: Math.floor(start / 10) + 1 })
        for (const item of batch) {
          try { await waitForAiSlot(); await generateOne(item, record); setPlan((current) => current.map((x) => x.id === item.id ? { ...x, status: 'saved', error: undefined } : x)) }
          catch (error) { const message = error instanceof Error ? error.message : 'Generation failed.'; setPlan((current) => current.map((x) => x.id === item.id ? { ...x, status: 'failed', error: message } : x)) }
          done++; setProgress({ done, total: pending.length, batch: Math.floor(start / 10) + 1 })
        }
      }
      setNotice('Batch run finished. Saved items remain drafts in their existing CMS. Failed items can be retried. Nothing was published.')
    } finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-surface"><div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Admin / AI CMS Command Center</p><h1 className="mt-2 font-serif text-3xl font-bold text-navy">AI CMS Command Center</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Hindi ya English mein command likho. Pehle plan review hoga, phir 10-item batches mein drafts generate honge. Publishing manual rahegi.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/service-builder" className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">Service Builder</Link><Link href="/admin/blogs" className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">Blog Management</Link><Link href="/admin/pages" className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy">Pages Management</Link></div></div>
    <section className="rounded-xl border border-border bg-background p-5 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-navy">Aap kya create karna chahte hain?</h2><p className="mt-1 text-sm text-muted-foreground">Approval first · Draft only · Existing CMS storage</p></div><span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-bold text-brand">Draft mode</span></div>
      <label className="mt-5 block text-sm font-semibold text-navy">Natural-language command</label><textarea value={command} onChange={(event) => setCommand(event.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" placeholder="Example: Food Licence par 30 SEO blog drafts banao, unique slug, meta description aur FAQs ke saath." />
      <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="flex flex-col gap-2 text-sm font-semibold text-navy">Destination<select value={destination} onChange={(event) => setDestination(event.target.value as 'service' | 'blog' | 'both')} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground"><option value="service">Service / landing pages</option><option value="blog">Blog posts</option><option value="both">Both: service pages + blogs</option></select></label><label className="flex flex-col gap-2 text-sm font-semibold text-navy">Base service<select value={serviceSlug} onFocus={() => { if (!records.length) loadRecords() }} onChange={(event) => setServiceSlug(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2.5 font-normal text-foreground">{(records.length ? records : getBuilderRecords()).map((record) => <option key={record.serviceSlug} value={record.serviceSlug}>{record.serviceName}</option>)}</select></label></div>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={planCommand} className="rounded-lg bg-brand px-5 py-3 text-sm font-bold text-white">1. Generate plan</button><button type="button" onClick={() => { setPlan([]); setApproved(false); setNotice('Plan cleared. Previously saved content was not deleted.') }} className="rounded-lg border border-border px-5 py-3 text-sm font-bold text-navy">Clear plan</button></div>
      <p className="mt-3 text-xs text-muted-foreground">State-wise plan uses India’s 28 states and 8 Union Territories. Extra requested items use distinct topic angles, not only swapped location names. Review titles/slugs before approving.</p>
    </section>
    {notice && <div role="status" className="mt-4 rounded-lg border border-border bg-background p-4 text-sm text-foreground">{notice}</div>}
    {plan.length > 0 && <section className="mt-6 rounded-xl border border-border bg-background p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-navy">Command execution plan</h2><p className="mt-1 text-sm text-muted-foreground">{plan.length} planned · {saved} saved · {failed} failed · batches of 10</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => { setApproved(true); setNotice('Plan approved. Press Start batch generation when ready.') }} className="rounded-lg border border-brand px-4 py-2.5 text-sm font-bold text-brand disabled:opacity-50">Approve plan</button><button type="button" disabled={!approved || busy} onClick={() => void run(false)} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Start batch generation</button>{failed > 0 && <button type="button" disabled={!approved || busy} onClick={() => void run(true)} className="rounded-lg border border-border px-4 py-2.5 text-sm font-bold text-navy disabled:opacity-50">Retry failed</button>}</div></div>
      {approved && <p className="mt-3 rounded-lg bg-brand-tint p-3 text-sm text-brand">Approved. Up to 10 items process per batch, sequentially. Drafts only; no auto-publish.</p>}
      {busy && <div className="mt-4"><div className="flex justify-between text-sm"><span>Batch {progress.batch} · processing</span><span>{progress.done}/{progress.total}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full bg-brand transition-all" style={{ width: (progress.total ? (progress.done / progress.total) * 100 : 0) + '%' }} /></div></div>}
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase text-muted-foreground"><th className="py-3 pr-3"># / type</th><th className="py-3 pr-3">Title</th><th className="py-3 pr-3">Slug</th><th className="py-3 pr-3">Location</th><th className="py-3">Status</th></tr></thead><tbody>{plan.map((item, index) => <tr key={item.id} className="border-b border-border/70 align-top"><td className="py-3 pr-3"><span className="font-semibold text-navy">{index + 1}</span><div className="mt-1 text-xs text-muted-foreground">{item.kind === 'blog' ? 'Blog' : 'Service page'}</div></td><td className="py-3 pr-3 font-medium text-navy">{item.title}{item.error && <p className="mt-1 max-w-xs text-xs text-red-600">{item.error}</p>}</td><td className="break-all py-3 pr-3 font-mono text-xs text-muted-foreground">{item.slug}</td><td className="py-3 pr-3 text-muted-foreground">{item.location || '—'}</td><td className="py-3"><span className={'inline-flex rounded-full px-2 py-1 text-xs font-bold ' + (item.status === 'saved' ? 'bg-green-100 text-green-800' : item.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-surface text-muted-foreground')}>{item.status}</span></td></tr>)}</tbody></table></div>
      <p className="mt-3 text-xs text-muted-foreground">Generation uses the configured server AI. Authentication, database or AI configuration errors are shown per item; retry failed items after fixing the cause.</p>
    </section>}
  </div></main>
}
