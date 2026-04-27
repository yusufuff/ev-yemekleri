import type { Metadata, Viewport } from 'next'
import * as Sentry from '@sentry/nextjs'
import { DM_Sans } from 'next/font/google'
import '@/styles/globals.css'
import { CartProvider } from '@/hooks/useCart'
import { PWAProvider } from '@/components/pwa/PWAPrompt'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { ToastProvider } from '@/components/ui/Toast'
import NotificationPermission from '@/components/NotificationPermission'

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
  title:       { default: 'Anneelim', template: '%s – Anneelim' },
  description: 'Mahallendeki ev aşçılarından taze, sıcak yemek siparişi et.',
  keywords:    ['ev yemeği', 'yemek siparişi', 'ev aşçısı', 'Türkiye'],
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:    true,
    title:      'Anneelim',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type:        'website',
    locale:      'tr_TR',
    title:       'Anneelim',
    description: 'Yakınındaki ev aşçılarından taze yemek siparişi.',
    images: [{ url: '/icons/og-image.png', width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: '/icons/icon-32.png',  sizes: '32x32',   type: 'image/png' },
      { url: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
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
              <NotificationPermission />
              {children}
              <footer style={{ borderTop: '1px solid #E8E0D4', padding: '24px', textAlign: 'center', background: '#FAF6EF', marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <a href="/gizlilik-politikasi" style={{ fontSize: '13px', color: '#8A7B6B', textDecoration: 'none' }}>Gizlilik Politikası</a>
                  <a href="/kullanim-kosullari" style={{ fontSize: '13px', color: '#8A7B6B', textDecoration: 'none' }}>Kullanım Koşulları</a>
                  <a href="/kvkk" style={{ fontSize: '13px', color: '#8A7B6B', textDecoration: 'none' }}>KVKK</a>
                  <a href="/sss" style={{ fontSize: '13px', color: '#8A7B6B', textDecoration: 'none' }}>SSS</a>
                  <a href="/hakkimizda" style={{ fontSize: '13px', color: '#8A7B6B', textDecoration: 'none' }}>Hakkımızda</a>
                </div>
                <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>© 2026 Anneelim. Tüm hakları saklıdır.</p>
              </footer>
            </PWAProvider>
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  )
}