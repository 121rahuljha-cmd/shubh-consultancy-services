import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DEFAULT_PLACE_ID = 'ChIJkTi7COtYH44RWlrdu9MW2mY'
const CACHE_SECONDS = 60 * 60 * 24 * 30

type GoogleReview = {
  name?: string
  rating?: number
  text?: { text?: string }
  relativePublishTimeDescription?: string
  publishTime?: string
  authorAttribution?: {
    displayName?: string
    photoUri?: string
    uri?: string
  }
}

type PlaceDetails = {
  displayName?: { text?: string }
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: GoogleReview[]
}

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID || DEFAULT_PLACE_ID

  if (!apiKey) {
    return NextResponse.json(
      { configured: false, reviews: [], error: 'Google reviews are not configured yet.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,googleMapsUri,reviews',
        },
        next: { revalidate: CACHE_SECONDS },
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { configured: true, reviews: [], error: 'Google reviews are temporarily unavailable.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const place = (await response.json()) as PlaceDetails
    const reviews = (place.reviews || [])
      .filter((review) => typeof review.rating === 'number' && review.rating > 4)
      .map((review) => ({
        name: review.authorAttribution?.displayName || 'Google reviewer',
        rating: review.rating as number,
        text: review.text?.text || '',
        relativeTime: review.relativePublishTimeDescription || '',
        publishedAt: review.publishTime || '',
        authorPhoto: review.authorAttribution?.photoUri || '',
        authorUrl: review.authorAttribution?.uri || '',
      }))
      .filter((review) => review.text.length > 0)

    return NextResponse.json(
      {
        configured: true,
        businessName: place.displayName?.text || 'Shubh Consultancy Services',
        rating: place.rating ?? null,
        reviewCount: place.userRatingCount ?? null,
        googleMapsUrl: place.googleMapsUri || 'https://www.google.com/maps',
        reviews,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
        },
      },
    )
  } catch {
    return NextResponse.json(
      { configured: true, reviews: [], error: 'Google reviews are temporarily unavailable.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
