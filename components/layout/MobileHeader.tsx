// @ts-nocheck
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CartButton } from '@/components/cart/CartButton'

interface MobileHeaderProps {
  title?:    string
  showBack?: boolean
  actions?:  React.ReactNode
}

export function MobileHeader({ title, showBack, actions }: MobileHeaderProps) {
  const router = useRouter()

  return (
    <header className="mobile-header">

      {/* Sol: geri / logo */}
      <div className="mh-left">
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="mh-back"
            aria-label="Geri"
          >
            ←
          </button>
        ) : (
          <Link href="/" className="mh-logo">
            <span className="mh-logo-text">anneelim</span>
            <span className="mh-logo-dot">.com</span>
          </Link>
        )}
      </div>

      {/* Sağ: arama + ekstra aksiyonlar + sepet */}
      <div className="mh-right">
        {actions}

        {/* Arama butonu */}
        <Link
          href="/ara"
          aria-label="Yemek Ara"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#F3EDE4',
            textDecoration: 'none',
            fontSize: 18,
          }}
        >
          🔍
        </Link>

        <CartButton />
      </div>
    </header>
  )
}