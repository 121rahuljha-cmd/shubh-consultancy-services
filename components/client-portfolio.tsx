
import Image from 'next/image'
import type { ClientRecord } from '@/lib/clients'

const fallbackClients = [
  { name: 'Chai Bunk', logo: '/client-logos/Chai-Bunk.png', category: 'Food & Beverage' },
  { name: 'Chai City', logo: '/client-logos/Chai-City.png', category: 'Food & Beverage' },
  { name: 'Chicka Litti', logo: '/client-logos/Chicka-Litti.png', category: 'Food & Beverage' },
  { name: 'Dakshinam', logo: '/client-logos/Dakshinam.png', category: 'Food & Beverage' },
  { name: 'Gopure Natural', logo: '/client-logos/Gopure-Natural.png', category: 'Natural Products' },
  { name: 'Mr Sandwich', logo: '/client-logos/Mr-Sandwich.png', category: 'Food & Beverage' },
  { name: 'Suto Cafe', logo: '/client-logos/Suto-Cafe.jpeg', category: 'Cafe & Restaurant' },
  { name: 'Tealogy', logo: '/client-logos/Tealogy.png', category: 'Beverage Partner' },
  { name: 'Waffle Castle', logo: '/client-logos/Waffle-Castle.png', category: 'Food & Beverage' },
]

type ClientPortfolioProps = {
  clients?: ClientRecord[]
  showViewMore?: boolean
}

export function ClientPortfolio({
  clients,
  showViewMore = true,
}: ClientPortfolioProps) {
  const displayClients =
    clients && clients.length > 0
      ? clients.map((client) => ({
          name: client.name,
          logo: client.logo,
          logoAlt: client.logoAlt || `${client.name} logo`,
          category: client.description || 'Client',
        }))
      : fallbackClients.map((client) => ({
          ...client,
          logoAlt: `${client.name} logo`,
        }))

  const runningClients = [...displayClients, ...displayClients]

  return (
    <section className="overflow-hidden bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#1677ff]">
              Our Clients
            </p>

            <h2 className="font-heading text-4xl font-bold tracking-tight text-[#082b57] md:text-5xl">
              Businesses we support
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#64748b]">
              Trusted by businesses across different industries for
              registrations, compliance and professional services.
            </p>
          </div>

          {showViewMore && (
            <a
              href="/clients"
              className="hidden shrink-0 rounded-lg border border-[#1677ff] px-5 py-3 text-sm font-bold text-[#1677ff] transition hover:bg-[#1677ff] hover:text-white md:inline-flex"
            >
              View More Clients
            </a>
          )}
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

        <div className="client-logo-track flex w-max gap-5">
          {runningClients.map((client, index) => (
            <div
              key={`${client.name}-${index}`}
              className="group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#dbe5f0] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-[125px] items-center justify-center px-6 py-5">
                <Image
                  src={client.logo}
                  alt={client.logoAlt}
                  width={220}
                  height={100}
                  className="h-20 w-full object-contain"
                />
              </div>

              <div className="border-t border-[#e5edf5] px-4 py-3 text-center">
                <h3 className="font-heading text-sm font-bold text-[#082b57]">
                  {client.name}
                </h3>

                <span className="mt-2 inline-block rounded-full border border-[#dbe5f0] px-3 py-1 text-xs font-semibold text-[#475569] transition group-hover:border-[#20b486] group-hover:bg-[#20b486] group-hover:text-white">
                  {client.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showViewMore && (
        <div className="mt-8 px-6 text-center md:hidden">
          <a
            href="/clients"
            className="inline-flex rounded-lg border border-[#1677ff] px-5 py-3 text-sm font-bold text-[#1677ff]"
          >
            View More Clients
          </a>
        </div>
      )}

      <style>{`
        .client-logo-track {
          animation: client-scroll 35s linear infinite;
        }

        .client-logo-track:hover {
          animation-play-state: paused;
        }

        @keyframes client-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .client-logo-track {
            animation-duration: 28s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .client-logo-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
