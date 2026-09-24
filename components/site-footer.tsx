import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin, Phone, Clock } from 'lucide-react'
import { contact, getVisibleContactNumbers, navGroups } from '@/lib/site-data'

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Contact Us', href: '/contact' },
]

export function SiteFooter() {
  const columns = [
    navGroups.find((g) => g.label === 'Startup'),
    navGroups.find((g) => g.label === 'GST'),
    navGroups.find((g) => g.label === 'IT Services'),
  ].filter(Boolean) as typeof navGroups
  const visiblePhones = getVisibleContactNumbers()

  return (
    <footer className="bg-navy-deep text-white/70">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Brand column */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-md bg-brand font-heading text-[15px] font-extrabold text-white">
              SCS
            </span>
            <span className="font-heading text-base font-extrabold text-white">
              Shubh Consultancy Services
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed">
            We offer expert accounting, licensing and digital marketing solutions
            to streamline operations, ensure compliance and fuel business growth.
          </p>
          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex gap-3">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-brand"
                aria-hidden="true"
              />
              <span>{contact.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone
                className="mt-0.5 size-4 shrink-0 text-brand"
                aria-hidden="true"
              />
              <span className="flex flex-col">
                {visiblePhones.map((phone, index) => (
                  <a
                    key={`${phone.formatted}-${phone.href}`}
                    href={phone.href}
                    className={index === 0 ? 'font-semibold text-white transition-colors hover:text-brand' : 'font-semibold text-white transition-colors hover:text-brand'}
                  >
                    {phone.formatted}
                  </a>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <Mail
                className="mt-0.5 size-4 shrink-0 text-brand"
                aria-hidden="true"
              />
              <a
                href={contact.emailHref}
                className="break-all transition-colors hover:text-white"
              >
                {contact.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock
                className="mt-0.5 size-4 shrink-0 text-brand"
                aria-hidden="true"
              />
              <span>{contact.hours}</span>
            </li>
          </ul>
        </div>

        {/* Service columns */}
        {columns.map((group) => (
          <div key={group.label} className="flex flex-col gap-4">
            <h2 className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-white">
              {group.label}
            </h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-brand"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Secondary link row */}
      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-sm">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs sm:flex-row">
          <p>
            Copyright &copy; {new Date().getFullYear()} Shubh Consultancy
            Services. All rights reserved.
          </p>
          <p>Ghaziabad, Uttar Pradesh &middot; Serving clients across India</p>
        </div>
      </div>
    </footer>
  )
}
