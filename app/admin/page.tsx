import Link from 'next/link'
import { BookOpen, FileText, Layers3, Search, WandSparkles } from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
}

const modules = [
  { title: 'Blog Management', description: 'Create, edit, review and manage blog posts independently from service pages.', href: '/admin/blogs', icon: BookOpen, label: 'Blog posts' },
  { title: 'Service Pages', description: 'Manage service landing pages, page content, location targeting, FAQs and SEO settings.', href: '/admin/pages', icon: FileText, label: 'Page CMS' },
  { title: 'Service Inventory', description: 'Review service catalogue and research metadata. Inventory records are not automatically public pages.', href: '/admin/services', icon: Layers3, label: 'Inventory' },
  { title: 'Content Studio', description: 'Prepare structured content drafts and source-note analysis. Generated content is not published automatically.', href: '/admin/content-studio', icon: WandSparkles, label: 'Draft workspace' },
]

export default function AdminDashboard() {
  return <main className="min-h-screen bg-surface">
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <p className="eyebrow">Shubh Consultancy Services</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-navy md:text-4xl">Admin Dashboard</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Choose a separate workspace. Blog content and service landing pages use different management screens and should not be mixed.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {modules.map(({ title, description, href, icon: Icon, label }) => <Link key={href} href={href} className="group rounded-xl border border-border bg-background p-6 transition hover:border-brand hover:shadow-sm">
          <div className="flex items-start justify-between gap-4"><span className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand"><Icon className="size-5" aria-hidden="true" /></span><span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span></div>
          <h2 className="mt-5 font-serif text-xl font-bold text-navy group-hover:text-brand">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand">Open workspace <span aria-hidden="true">→</span></span>
        </Link>)}
      </div>
    </div>
  </main>
}
