'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  ['Dashboard', '/admin'],
  ['Aşçılar', '/admin/asciler'],
  ['Kullanıcılar', '/admin/kullanicilar'],
  ['Siparişler', '/admin/siparisler'],
  ['Ödemeler', '/admin/odemeler'],
  ['Üyelikler', '/admin/uyelikler'],
  ['Yöneticiler', '/admin/yoneticiler'],
  ['Yemek Fotoları', '/admin/yemekler'],
  ['Destek', '/admin/destek'],
  ['Blog', '/admin/blog'],
  ['Kampanya', '/admin/kampanya'],
  ['Sözleşmeler', '/admin/sozlesmeler'],
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/admin/giris') return <>{children}</>
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: 220, background: '#4A2C0E', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 900, color: 'white' }}>ANNEELIM</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Admin Paneli</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV_LINKS.map(([label, href]) => {
            const isActive = pathname === href
            return (
              <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent', textDecoration: 'none' }}>
                <span style={{ fontSize: 13, color: isActive ? 'white' : 'rgba(255,255,255,0.65)', fontWeight: isActive ? 700 : 400 }}>{label}</span>
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', marginBottom: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3D6B47' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Canlı İzleniyor</span>
          </div>
          <button
            onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); window.location.href = '/' }}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '6px 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>
      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}