import { CtaBand } from '@/components/home/cta-band'
import { Hero } from '@/components/home/hero'
import { HowItWorks } from '@/components/home/how-it-works'
import { ServicesGrid } from '@/components/home/services-grid'
import { StatsStrip } from '@/components/home/stats-strip'
import { Testimonials } from '@/components/home/testimonials'
import { WhyChooseUs } from '@/components/home/why-choose-us'

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <ServicesGrid />
      <HowItWorks />
      <WhyChooseUs />
      <Testimonials />
      <CtaBand />
    </>
  )
}
