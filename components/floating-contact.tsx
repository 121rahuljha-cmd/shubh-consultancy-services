import { MessageCircle, Phone } from 'lucide-react'
import { contact } from '@/lib/site-data'

export function FloatingContact() {
  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-2.5 sm:right-5">
      <a
        href={contact.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex size-12 items-center justify-center rounded-full bg-navy text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        <span className="sr-only">Chat with us on WhatsApp</span>
      </a>
      <a
        href={contact.phonePrimaryHref}
        className="flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105"
      >
        <Phone className="size-5" aria-hidden="true" />
        <span className="sr-only">Call {contact.phonePrimary}</span>
      </a>
    </div>
  )
}
