import type { Metadata } from 'next'
import { ContentPlan } from '@/components/admin/content-plan'

export const metadata: Metadata = { title: 'Content Plan', robots: { index: false, follow: false } }
export default function ContentPlanPage() { return <><section className="border-b border-border bg-navy px-4 py-5 text-white"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 md:px-8"><div><p className="text-xs font-bold uppercase tracking-wider text-white/60">SEO page target</p><p className="font-serif text-3xl font-bold">10,000</p></div><p className="max-w-xl text-sm text-white/75">Actual records only. Plans stay noindex until they pass editorial, SEO, originality, and location-value review.</p></div></section><div className="content-plan-shell"><ContentPlan /></div></> }
