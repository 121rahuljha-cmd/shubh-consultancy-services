'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  X,
} from 'lucide-react'
import { contact, getVisibleContactNumbers } from '@/lib/site-data'
import { getPublicServiceGroups, getSavedPublicServiceGroups, type PublicServiceGroup } from '@/lib/public-services'
import { cn } from '@/lib/utils'
import { HeaderDropdownOverlay } from '@/components/header-dropdown-overlay'

function Logo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center"
      aria-label="Shubh Consultancy Services — home"
    >
      <Image
        src="/scs-logo.svg"
        alt="Shubh Consultancy Services logo"
        width={230}
        height={48}
        priority
        className="h-10 w-[190px] shrink-0 object-contain"
      />
    </Link>
  )
}

export function SiteHeader() {
  const [navGroups, setNavGroups] = useState<PublicServiceGroup[]>(() => getPublicServiceGroups())
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileGroup, setMobileGroup] = useState<string | null>(null)
  const pathname = usePathname()
  const visiblePhones = getVisibleContactNumbers()

  useEffect(() => {
    setMobileOpen(false)
    setOpenGroup(null)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    const refresh = () => setNavGroups(getSavedPublicServiceGroups())
    refresh()
    window.addEventListener('scs-service-builder-updated', refresh)
    window.addEventListener('scs-menu-updated', refresh)
    return () => { window.removeEventListener('scs-service-builder-updated', refresh); window.removeEventListener('scs-menu-updated', refresh) }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Utility bar */}
      <div className="hidden bg-navy-deep text-white lg:block">
        <div className="container-page flex h-10 items-center justify-between gap-6 text-xs">
          <p className="flex items-center gap-2 text-white/70">
            <MapPin className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
            <span className="truncate">{contact.address}</span>
          </p>
          <div className="flex shrink-0 items-center gap-5">
            <a
              href={contact.emailHref}
              className="flex items-center gap-1.5 text-white/80 transition-colors hover:text-white"
            >
              <Mail className="size-3.5 text-brand" aria-hidden="true" />
              {contact.email}
            </a>
            <span className="h-3.5 w-px bg-white/20" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <Phone className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
              {visiblePhones.map((phone, index) => (
                <div key={`${phone.formatted}-${phone.href}`} className="flex items-center gap-3">
                  {index > 0 && <span className="text-white/30">|</span>}
                  <a
                    href={phone.href}
                    className="font-semibold text-white transition-colors hover:text-brand"
                  >
                    {phone.formatted}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-background shadow-sm">
        <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[68px]">
          <Logo />

          {/* Desktop nav */}
          <nav
            className="relative hidden h-full items-center overflow-visible lg:flex"
            aria-label="Main navigation"
          >
            {navGroups.map((group) => {
              const isOpen = openGroup === group.label
              return (
                <div
                  key={group.label}
                  className="relative h-full"
                  onMouseEnter={() => setOpenGroup(group.label)}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenGroup(isOpen ? null : group.label)}
                    className={cn(
                      'flex h-full items-center gap-1 px-0.5 text-[13px] font-bold uppercase tracking-wide transition-colors 2xl:px-3',
                      isOpen ? 'text-brand' : 'text-navy hover:text-brand',
                    )}
                  >
                    {group.label}
                    <ChevronDown
                      className={cn(
                        'size-3.5 transition-transform',
                        isOpen && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <HeaderDropdownOverlay
                      group={group}
                      isOpen={isOpen}
                      onClose={() => setOpenGroup(null)}
                    />
                  )}
                </div>
              )
            })}

            <Link
              href="/contact"
              className={cn(
                'flex h-full items-center px-0.5 text-[13px] font-bold uppercase tracking-wide transition-colors 2xl:px-3',
                pathname === '/contact'
                  ? 'text-brand'
                  : 'text-navy hover:text-brand',
              )}
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-md border border-border px-3.5 py-2.5 text-[13px] font-bold text-navy transition-colors hover:border-brand hover:text-brand xl:flex"
            >
              WhatsApp
            </a>
            <a
              href={contact.phonePrimaryHref}
              className="flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-brand-hover"
            >
              <Phone className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Talk to an Expert</span>
              <span className="sm:hidden">Call Now</span>
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-10 items-center justify-center rounded-md border border-border text-navy lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
            <Logo />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex size-10 items-center justify-center rounded-md border border-border text-navy"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav
            className="flex-1 overflow-y-auto px-4 py-4"
            aria-label="Mobile navigation"
          >
            {navGroups.map((group) => {
              const isOpen = mobileGroup === group.label
              return (
                <div key={group.label} className="border-b border-border">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setMobileGroup(isOpen ? null : group.label)}
                    className="flex w-full items-center justify-between py-3.5 text-left font-heading text-sm font-bold uppercase tracking-wide text-navy"
                  >
                    {group.label}
                    <Plus
                      className={cn(
                        'size-4 shrink-0 text-brand transition-transform',
                        isOpen && 'rotate-45',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <ul className="flex flex-col gap-1 pb-3">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="block rounded-md bg-surface px-3 py-2.5 text-sm font-medium text-navy-soft"
                          >
                            {item.navLabel}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}

            <Link
              href="/contact"
              className="block border-b border-border py-3.5 font-heading text-sm font-bold uppercase tracking-wide text-navy"
            >
              Contact
            </Link>

            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={contact.phonePrimaryHref}
                className="flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 text-sm font-bold text-white"
              >
                <Phone className="size-4" aria-hidden="true" />
                Call {contact.phonePrimary}
              </a>
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-bold text-navy"
              >
                Chat on WhatsApp
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
