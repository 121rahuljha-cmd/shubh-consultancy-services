'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

type Review = {
  name: string
  rating: number
  text: string
  relativeTime: string
  publishedAt: string
  authorPhoto: string
  authorUrl: string
}

type ReviewResponse = {
  configured: boolean
  businessName?: string
  rating?: number | null
  reviewCount?: number | null
  googleMapsUrl?: string
  reviews: Review[]
  error?: string
}

export function GoogleReviews() {
  const [data, setData] = useState<ReviewResponse | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/google-reviews')
      .then((response) => response.json())
      .then((result: ReviewResponse) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setData({ configured: false, reviews: [], error: 'Google reviews are temporarily unavailable.' })
      })
    return () => { active = false }
  }, [])

  const reviews = data?.reviews || []

  useEffect(() => {
    if (paused || reviews.length < 2) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % reviews.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [paused, reviews.length])

  useEffect(() => {
    setActiveIndex((current) => reviews.length ? current % reviews.length : 0)
  }, [reviews.length])

  if (!data?.configured || reviews.length === 0) {
    return (
      <section className="bg-white py-14 md:py-16" aria-labelledby="google-reviews-title">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#1677ff]">Google Reviews</p>
              <h2 id="google-reviews-title" className="font-heading text-3xl font-bold tracking-tight text-[#082b57] md:text-4xl">What our clients say</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#64748b]">Real reviews from our Google Business Profile. Updated automatically every month.</p>
            </div>
            <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#1677ff] hover:underline">Find us on Google Maps ↗</a>
          </div>
          <p className="mt-6 rounded-xl border border-[#dbe5f0] bg-white p-5 text-sm text-[#64748b]">
            {data?.error || 'Google reviews will appear here once the server-side Google Places API key is configured.'}
          </p>
        </div>
      </section>
    )
  }

  const visibleReviews = Array.from(
    { length: Math.min(4, reviews.length) },
    (_, offset) => reviews[(activeIndex + offset) % reviews.length],
  )

  return (
    <section
      className="bg-white py-14 md:py-16"
      aria-labelledby="google-reviews-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#1677ff]">Google Reviews</p>
            <h2 id="google-reviews-title" className="font-heading text-3xl font-bold tracking-tight text-[#082b57] md:text-4xl">What our clients say</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#64748b]">Real reviews from our Google Business Profile. Updated automatically every month.</p>
          </div>
          <a href={data.googleMapsUrl || 'https://www.google.com/maps'} target="_blank" rel="noreferrer" className="shrink-0 text-left md:text-right">
            <span className="block text-3xl font-bold tracking-tight text-[#4285f4]">Google</span>
            <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#082b57]">
              {data.rating == null ? 'Google Business Profile' : data.rating.toFixed(1)}
              {data.rating != null && <span className="flex text-[#fbbc04]" aria-label={`${data.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 fill-current" strokeWidth={0} />)}</span>}
            </span>
            {data.reviewCount != null && <span className="mt-1 block text-sm text-[#64748b]">({data.reviewCount.toLocaleString()} reviews)</span>}
          </a>
        </div>

        <div className="relative">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleReviews.map((review, index) => (
              <article key={`${review.name}-${review.publishedAt}-${activeIndex}-${index}`} className="flex min-h-[220px] flex-col rounded-xl border border-[#dbe5f0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start gap-3">
                  {review.authorPhoto ? (
                    <Image src={review.authorPhoto} alt="" width={44} height={44} unoptimized referrerPolicy="no-referrer" className="size-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-lg font-semibold text-[#1a73e8]">{review.name.trim().charAt(0).toUpperCase() || 'G'}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#082b57]">{review.name}</p>
                    <p className="mt-1 text-xs text-[#64748b]">{review.relativeTime}</p>
                  </div>
                  {review.authorUrl && <a href={review.authorUrl} target="_blank" rel="noreferrer" aria-label={`Google profile for ${review.name}`} className="text-lg text-[#7b91ae] hover:text-[#1677ff]">↗</a>}
                </div>
                <div className="mt-4 flex gap-0.5 text-[#fbbc04]" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-5 ${i < review.rating ? 'fill-current' : ''}`} strokeWidth={i < review.rating ? 0 : 1.5} />)}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-5 text-[#52647f]">{review.text}</blockquote>
                <p className="mt-4 text-xs font-medium text-[#64748b]">Review via Google</p>
              </article>
            ))}
          </div>

          {reviews.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button type="button" onClick={() => setActiveIndex((current) => (current - 1 + reviews.length) % reviews.length)} aria-label="Previous Google reviews" className="flex size-10 items-center justify-center rounded-full border border-[#dbe5f0] bg-white text-[#082b57] shadow-sm transition hover:border-[#1677ff] hover:text-[#1677ff]">
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex items-center gap-2" aria-label="Google reviews pages">
                {reviews.map((review, index) => (
                  <button key={`${review.name}-${index}`} type="button" onClick={() => setActiveIndex(index)} aria-label={`Show review page ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined} className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-[#1677ff]' : 'w-2 bg-[#cbd5e1] hover:bg-[#94a3b8]'}`} />
                ))}
              </div>
              <button type="button" onClick={() => setActiveIndex((current) => (current + 1) % reviews.length)} aria-label="Next Google reviews" className="flex size-10 items-center justify-center rounded-full border border-[#dbe5f0] bg-white text-[#082b57] shadow-sm transition hover:border-[#1677ff] hover:text-[#1677ff]">
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
