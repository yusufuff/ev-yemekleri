'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { clsx } from 'clsx'

// ── Tab tanımları ─────────────────────────────────────────────────────────────

interface Tab {
  href:    string
  icon:    string
  iconActive: string
  label:   string
  badge?:  number | null
}

// Misafir / alıcı tabları
const TABS_BUYER: Tab[] = [
  { href: '/',             icon: '🏠', iconActive: '🏠', label: 'Ana Sayfa' },
  { href: '/kesif',        icon: '🔍', iconActive: '🔍', label: 'Keşfet' },
  { href: '/odeme',        icon: '🛒', iconActive: '🛒', label: 'Sepet' },   // sepet badge dinamik
  { href: '/siparislerim', icon: '📦', iconActive: '📦', label: 'Siparişler' },
  { href: '/profil',       icon: '👤', iconActive: '👤', label: 'Profil' },
]

// Aşçı tabları
const TABS_CHEF: Tab[] = [
  { href: '/dashboard',  icon: '📊', iconActive: '📊', label: 'Dashboard' },
  { href: '/siparisler', icon: '📋', iconActive: '📋', label: 'Siparişler' },
  { href: '/menu',       icon: '🍳', iconActive: '🍳', label: 'Menü' },
  { href: '/kazanc',     icon: '💰', iconActive: '💰', label: 'Kazanç' },
  { href: '/asci-ayarlar', icon: '⚙️', iconActive: '⚙️', label: 'Profil' },
]

interface BottomNavProps {
  role?: 'buyer' | 'chef' | 'admin' | null
  orderBadge?: number
}

export function BottomNav({ role, orderBadge }: BottomNavProps) {
  const pathname = usePathname()
  const { itemCount } = useCart()

  const tabs = role === 'chef' ? TABS_CHEF : TABS_BUYER

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  // Dinamik badge'ler
  const getBadge = (tab: Tab): number | null => {
    if (tab.href === '/odeme' && itemCount > 0)    return itemCount
    if (tab.href === '/siparisler' && orderBadge)  return orderBadge
    if (tab.href === '/siparislerim' && orderBadge) return orderBadge
    return tab.badge ?? null
  }

  return (
    <nav
      className="bottom-nav"
      role="navigation"
      aria-label="Alt navigasyon"
    >
      {tabs.map(tab => {
        const active = isActive(tab.href)
        const badge  = getBadge(tab)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx('bn-tab', active && 'bn-tab--active')}
            aria-current={active ? 'page' : undefined}
            aria-label={`${tab.label}${badge ? `, ${badge} bildirim` : ''}`}
          >
            {/* İkon */}
            <span className="bn-icon" aria-hidden>
              {tab.icon}
            </span>

            {/* Badge */}
            {badge && badge > 0 && (
              <span className="bn-badge" aria-hidden>
                {badge > 99 ? '99+' : badge}
              </span>
            )}

            {/* Etiket */}
            <span className="bn-label">{tab.label}</span>

            {/* Aktif göstergesi */}
            {active && <span className="bn-active-pip" aria-hidden />}
          </Link>
        )
      })}

      <style>{`
        /* ── Kapsayıcı ──────────────────────────────── */
        .bottom-nav {
          display: none;              /* masaüstünde gizli */
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 200;

          background: var(--white);
          border-top: 1px solid var(--gray-light);
          box-shadow: 0 -4px 24px rgba(74,44,14,0.10);

          /* iOS safe area — çentik telefonlar için */
          padding-bottom: env(safe-area-inset-bottom, 0px);

          display: none;
          grid-template-columns: repeat(5, 1fr);
          align-items: stretch;
        }

        @media (max-width: 767px) {
          .bottom-nav { display: grid; }
        }

        /* ── Tab ────────────────────────────────────── */
        .bn-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 8px 4px 6px;
          text-decoration: none;
          position: relative;
          min-height: 56px;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }

        .bn-tab:active {
          background: var(--cream);
        }

        /* ── İkon ───────────────────────────────────── */
        .bn-icon {
          font-size: 22px;
          line-height: 1;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
          display: block;
        }

        .bn-tab--active .bn-icon {
          transform: translateY(-2px) scale(1.12);
        }

        /* ── Etiket ─────────────────────────────────── */
        .bn-label {
          font-size: 10px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          color: var(--gray);
          line-height: 1;
          letter-spacing: 0.2px;
          transition: color 0.15s;
          white-space: nowrap;
        }

        .bn-tab--active .bn-label {
          color: var(--orange);
        }

        /* ── Aktif pip ──────────────────────────────── */
        .bn-active-pip {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 24px; height: 3px;
          background: var(--orange);
          border-radius: 0 0 3px 3px;
          animation: pip-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes pip-in {
          from { width: 0; opacity: 0; }
          to   { width: 24px; opacity: 1; }
        }

        /* ── Badge ──────────────────────────────────── */
        .bn-badge {
          position: absolute;
          top: 6px;
          left: calc(50% + 6px);
          background: var(--orange);
          color: white;
          font-size: 9px;
          font-weight: 800;
          font-family: 'DM Sans', sans-serif;
          min-width: 16px; height: 16px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 3px;
          border: 2px solid var(--white);
          animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
          line-height: 1;
        }

        @keyframes badge-pop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
      `}</style>
    </nav>
  )
}
