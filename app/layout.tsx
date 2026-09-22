import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FloatingContact } from '@/components/floating-contact'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL || process.env.APP_URL || 'https://example.com'),
  title: {
    default:
      'Shubh Consultancy Services | FSSAI, GST, ITR, Trademark & Company Registration',
    template: '%s | Shubh Consultancy Services',
  },
  description:
    'Shubh Consultancy Services helps businesses across India with company registration, FSSAI food licences, GST, income tax returns, trademark filing, ROC compliance and digital marketing. Based in Ghaziabad, serving clients nationwide.',
  keywords: [
    'FSSAI licence',
    'GST registration',
    'income tax return filing',
    'trademark registration',
    'company registration India',
    'ROC compliance',
    'chartered accountant Ghaziabad',
    'business consultant Ghaziabad',
  ],
  authors: [{ name: 'Shubh Consultancy Services' }],
  generator: 'v0.app',
  openGraph: {
    title:
      'Shubh Consultancy Services | Compliance, Tax & Licensing Consultants',
    description:
      'Expert accounting, licensing and digital marketing solutions to streamline operations, ensure compliance and fuel business growth.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Shubh Consultancy Services',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/placeholder-logo.svg', type: 'image/svg+xml' },
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0B2E5B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} bg-background`}>
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <FloatingContact />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
