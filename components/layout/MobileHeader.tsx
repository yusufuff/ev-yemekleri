'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CartButton } from '@/components/cart/CartButton'

interface MobileHeaderProps {
  title?:      string     // Sayfa başlığı (belirtilmezse logo gösterilir)
  showBack?:   boolean    // Geri butonu
  actions?:    React.ReactNode
}

export function MobileHeader({ title, showBack, actions }: MobileHeaderProps) {
  const router = useRouter()

  return (
    <header className="mobile-header">

      {/* Sol: geri / logo */}
      <div className="mh-left">
        {showBack ? (
          <button
            className="mh-back"
            onClick={() => router.back()}
            aria-label="Geri"
          >
            ←
          </button>
        ) : (
          <Link href="/" className="mh-logo">
            <span className="mh-logo-text">EV YEMEKLERİ</span>
          </Link>
        )}
      </div>

      {/* Orta: sayfa başlığı */}
      {title && (
        <div className="mh-title" aria-live="polite">
          {title}
        </div>
      )}

      {/* Sağ: aksiyonlar + sepet */}
      <div className="mh-right">
        {actions}
        <CartButton />
      </div>

      <style>{`
        .mobile-header {
          display: none;
          position: sticky;
          top: 0; left: 0; right: 0;
          z-index: 150;

          background: var(--white);
          border-bottom: 1px solid var(--gray-light);
          box-shadow: 0 2px 12px rgba(74,44,14,0.06);

          /* iOS safe area */
          padding-top: env(safe-area-inset-top, 0px);

          height: calc(56px + env(safe-area-inset-top, 0px));
          align-items: center;
          padding-left: 16px;
          padding-right: 16px;
          gap: 12px;
        }

        @media (max-width: 767px) {
          .mobile-header { display: flex; }
        }

        /* ── Sol ────────────────── */
        .mh-left { display: flex; align-items: center; flex-shrink: 0; }

        .mh-back {
          width: 36px; height: 36px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 10px;
          font-size: 18px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--brown);
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }

        .mh-back:active {
          background: var(--gray-light);
          transform: scale(0.95);
        }

        .mh-logo { text-decoration: none; }

        .mh-logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 900;
          color: var(--brown);
          letter-spacing: 0.3px;
          line-height: 1;
        }

        /* ── Orta ───────────────── */
        .mh-title {
          flex: 1;
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--brown);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Sağ ────────────────── */
        .mh-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }
      `}</style>
    </header>
  )
}
