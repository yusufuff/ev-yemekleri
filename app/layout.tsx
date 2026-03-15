import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import '@/styles/globals.css'
import { CartProvider } from '@/hooks/useCart'
import { PWAProvider } from '@/components/pwa/PWAPrompt'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { ToastProvider } from '@/components/ui/Toast'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const viewport: Viewport = {
  themeColor:        '#E8622A',
  width:             'device-width',
  initialScale:      1,
  maximumScale:      1,
  userScalable:      false,
  viewportFit:       'cover',
}

export const metadata: Metadata = {
  title:       { default: 'EV YEMEKLERİ', template: '%s — EV YEMEKLERİ' },
  description: 'Mahallendeki ev aşçılarından taze, sıcak yemek sipariş et.',
  keywords:    ['ev yemeği', 'yemek siparişi', 'ev aşçısı', 'Türkiye'],
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:    true,
    title:      'Ev Yemekleri',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type:        'website',
    locale:      'tr_TR',
    title:       'EV YEMEKLERİ',
    description: 'Yakınındaki ev aşçılarından taze yemek siparişi.',
    images: [{ url: '/icons/og-image.png', width: 1200, height: 630 }],
  },
  icons: {
    icon:    [
      { url: '/icons/icon-32.png',  sizes: '32x32',   type: 'image/png' },
      { url: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple:   [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    shortcut: '/icons/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={dmSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-cream text-brown antialiased">
        <CartProvider>
          <ToastProvider>
          <PWAProvider>
            <PublicNavbar />
            {children}
          </PWAProvider>
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  )
}