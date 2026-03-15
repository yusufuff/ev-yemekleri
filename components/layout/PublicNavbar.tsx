'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const CartButton = dynamic(
  () => import('@/components/cart/CartButton').then(m => ({ default: m.CartButton })),
  { ssr: false }
)

const NAV_LINKS = [
  { href: '/kesif',       label: 'Keşfet',      icon: '🔍' },
  { href: '/siparislerim',label: 'Siparişlerim', icon: '📦' },
  { href: '/mesajlar',    label: 'Mesajlar',     icon: '💬' },
  { href: '/favorilerim', label: 'Favoriler',    icon: '❤️' },
  { href: '/dashboard',   label: 'Panel',        icon: '📊' },
]

const HIDDEN_PATHS = ['/giris', '/kayit', '/admin']

export function PublicNavbar() {
  const pathname = usePathname()
  const hidden = HIDDEN_PATHS.some(p => pathname?.startsWith(p))
  if (hidden) return null

  return (
    <>
      {/* Masaüstü Navbar */}
      <nav style={{ background:'white', borderBottom:'1px solid #E8E0D4', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1152, margin:'0 auto', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color:'#4A2C0E', textDecoration:'none' }}>
            EV YEMEKLERİ
          </Link>

          {/* Masaüstü linkler */}
          <div style={{ display:'flex', alignItems:'center', gap:20 }} className="desktop-nav">
            {NAV_LINKS.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} style={{
                  fontSize:13, fontWeight:600, textDecoration:'none',
                  color: active ? '#E8622A' : '#8A7B6B',
                  borderBottom: active ? '2px solid #E8622A' : '2px solid transparent',
                  paddingBottom:2,
                }}>{item.label}</Link>
              )
            })}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <CartButton />
            <Link href="/giris" style={{ padding:'7px 14px', fontSize:12, fontWeight:600, color:'#4A2C0E', border:'1.5px solid #E8E0D4', borderRadius:8, textDecoration:'none' }}>
              Giriş Yap
            </Link>
            <Link href="/kayit" style={{ padding:'7px 14px', fontSize:12, fontWeight:700, color:'white', background:'#E8622A', borderRadius:8, textDecoration:'none' }}>
              ✨ Kayıt Ol
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobil bottom nav */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:200,
        background:'white', borderTop:'1px solid #E8E0D4',
        display:'flex', alignItems:'center',
        paddingBottom:'env(safe-area-inset-bottom, 0px)',
      }} className="mobile-nav">
        {[{ href:'/', icon:'🏠', label:'Ana Sayfa' }, ...NAV_LINKS.slice(0,3), { href:'/profil', icon:'👤', label:'Profil' }].map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:'8px 4px', textDecoration:'none', gap:2,
            }}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ fontSize:10, fontWeight: active ? 700 : 500, color: active ? '#E8622A' : '#8A7B6B' }}>
                {item.label}
              </span>
              {active && <div style={{ width:4, height:4, borderRadius:'50%', background:'#E8622A' }} />}
            </Link>
          )
        })}
        <div style={{ position:'absolute', top:0, right:16, height:'100%', display:'flex', alignItems:'center' }}>
          <CartButton />
        </div>
      </nav>

      <style>{`
        .desktop-nav { display: flex; }
        .mobile-nav { display: none; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </>
  )
}