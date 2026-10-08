'use client'

import { useLayoutEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { contact } from '@/lib/site-data'
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
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-3 border-r border-border pr-8">
          <span className="eyebrow">{group.label}</span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {group.blurb}
          </p>
          <a
            href={contact.phonePrimaryHref}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            Talk to a specialist
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {group.items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="group flex flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors hover:bg-brand-tint"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold text-navy group-hover:text-brand">
                  {item.navLabel}
                  <ArrowRight
                    className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
