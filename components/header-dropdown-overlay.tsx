'use client'

import { useLayoutEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { PublicServiceGroup } from '@/lib/public-services'

type HeaderDropdownOverlayProps = {
  group: PublicServiceGroup
  isOpen: boolean
  onClose: () => void
}

export function HeaderDropdownOverlay({
  group,
  isOpen,
  onClose,
}: HeaderDropdownOverlayProps) {
  const [top, setTop] = useState(0)

  useLayoutEffect(() => {
    if (!isOpen) return

    const header = document.querySelector('header')
    if (!header) return

    const updateTop = () => setTop(header.getBoundingClientRect().bottom + 4)
    updateTop()
    window.addEventListener('resize', updateTop)

    return () => window.removeEventListener('resize', updateTop)
  }, [isOpen, group.label])

  if (!isOpen) return null

  return (
    <div
      className="fixed left-1/2 z-[60] w-[calc(100vw-40px)] max-w-[1200px] overflow-x-hidden overflow-y-auto border-b border-border bg-background shadow-xl"
      style={{
        top,
        transform: 'translateX(-50%)',
        maxHeight: 'calc(100vh - 100px)',
        boxSizing: 'border-box',
      }}
      onMouseLeave={onClose}
      role="group"
      aria-label={`${group.label} menu`}
    >
      <div className="container-page py-7">
        <h2 className="mb-5 font-heading text-2xl font-bold text-[#2b5d8a]">
          {group.label}
        </h2>
        <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {group.items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="group flex min-h-11 items-center justify-between gap-3 rounded-md px-3 py-2.5 text-base font-medium text-navy transition-colors hover:bg-brand-tint hover:text-brand"
              >
                <span>{item.navLabel}</span>
                <ArrowRight
                  className="size-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
