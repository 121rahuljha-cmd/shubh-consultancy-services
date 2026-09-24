import { CtaBand } from '@/components/home/cta-band'
import { ClientPortfolio } from '@/components/client-portfolio'
import { Hero } from '@/components/home/hero'
import { HowItWorks } from '@/components/home/how-it-works'
import { ServicesGrid } from '@/components/home/services-grid'
import { StatsStrip } from '@/components/home/stats-strip'
import { Testimonials } from '@/components/home/testimonials'
import { WhyChooseUs } from '@/components/home/why-choose-us'
import { listEnabledClients } from '@/lib/clients'

export default async function HomePage() {
  const clients = await listEnabledClients()
  return (
    <>
      <Hero />
      <StatsStrip />
      <ServicesGrid />
      <HowItWorks />
      <WhyChooseUs />
      <Testimonials />
      <ClientPortfolio clients={clients} />
      <CtaBand />
    </>
  )
}
