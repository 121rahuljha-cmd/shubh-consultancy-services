import { CtaBand } from '@/components/home/cta-band'
import { ClientPortfolio } from '@/components/client-portfolio'
import { Hero } from '@/components/home/hero'
import { HowItWorks } from '@/components/home/how-it-works'
import { ServicesGrid } from '@/components/home/services-grid'
import { StatsStrip } from '@/components/home/stats-strip'
import { WhyChooseUs } from '@/components/home/why-choose-us'
import { listEnabledClients } from '@/lib/clients'
import { getPublicRouteMetadata } from '@/lib/public-route-metadata'

export async function generateMetadata() {
  const override = await getPublicRouteMetadata('home')
  return {
    title: override.title || undefined,
    description: override.description || undefined,
    alternates: override.canonical ? { canonical: override.canonical } : undefined,
    robots: override.robotsIndex === undefined ? undefined : {
      index: override.robotsIndex,
      follow: override.robotsFollow ?? true,
    },
  }
}

export default async function HomePage() {
  const clients = await listEnabledClients()
  return (
    <>
      <Hero />
      <StatsStrip />
      <ClientPortfolio clients={clients} />
      <ServicesGrid />
      <HowItWorks />
      <WhyChooseUs />
      <CtaBand />
    </>
  )
}
