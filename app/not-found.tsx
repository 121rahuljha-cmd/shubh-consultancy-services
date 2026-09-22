import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <main className="min-h-[60vh] bg-surface px-4 py-20"><div className="mx-auto max-w-3xl text-center"><p className="eyebrow">404</p><h1 className="mt-3 font-serif text-4xl font-bold text-navy">This page is not available</h1><p className="mt-4 text-muted-foreground">The address may have changed, or the page may still be under editorial review.</p><Link href="/" className="mt-8 inline-flex rounded-md bg-brand px-5 py-3 text-sm font-bold text-white">Return home</Link></div></main>
}
