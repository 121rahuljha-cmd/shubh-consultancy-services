import { stats } from '@/lib/site-data'

export function StatsStrip() {
  return (
    <section className="border-b border-border bg-background py-10 lg:py-12">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2.5">
            <span className="font-heading text-2xl font-extrabold text-brand sm:text-3xl">
              {stat.value}
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
