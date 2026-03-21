'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/',             icon: '🏠', label: 'Ana Sayfa' },
  { href: '/kesif',        icon: '🗺️', label: 'Keşfet' },
  { href: '/ara',          icon: '🔍', label: 'Ara' },
  { href: '/siparislerim', icon: '📦', label: 'Siparişler' },
  { href: '/profil',       icon: '👤', label: 'Profil' },
]

export function BottomNav() {
  const pathname = usePathname()

  const hidden = ['/giris', '/kayit', '/admin', '/dashboard', '/menu'].some(p => pathname?.startsWith(p))
  if (hidden) return null

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'white', borderTop: '1px solid #E8E0D4',
      display: 'flex', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }} className="md:hidden">
      {NAV_ITEMS.map(item => {
        const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '8px 4px', textDecoration: 'none', gap: 2,
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? '#E8622A' : '#8A7B6B', fontFamily: "'DM Sans', sans-serif" }}>
              {item.label}
            </span>
            {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#E8622A', marginTop: 2 }} />}
          </Link>
        )
      })}
    </nav>
  )
}