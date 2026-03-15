'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const CartButton = dynamic(
  () => import('@/components/cart/CartButton').then(m => ({ default: m.CartButton })),
  { ssr: false }
)

const NAV_LINKS = [
  { href: '/kesif',        label: 'Kesfet'       },
  { href: '/siparislerim', label: 'Siparislerim' },
  { href: '/mesajlar',     label: 'Mesajlar'     },
  { href: '/favorilerim',  label: 'Favoriler'    },
  { href: '/dashboard',    label: 'Panel'        },
  { href: '/profil',       label: 'Profil'       },
]

const HIDDEN_PATHS = ['/giris', '/kayit', '/admin']

export function PublicNavbar() {
  const pathname = usePathname()
  const hidden = HIDDEN_PATHS.some(p => pathname?.startsWith(p))
  if (hidden) return null

  return (
    <nav style={{ background:'white', borderBottom:'1px solid #E8E0D4', position:'sticky', top:0, zIndex:50 }}>
      <div style={{ maxWidth:1152, margin:'0 auto', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color:'#4A2C0E', textDecoration:'none' }}>
          EV YEMEKLERI
        </Link>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
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
            Giris Yap
          </Link>
          <Link href="/kayit" style={{ padding:'7px 14px', fontSize:12, fontWeight:700, color:'white', background:'#E8622A', borderRadius:8, textDecoration:'none' }}>
            Kayit Ol
          </Link>
        </div>
      </div>
    </nav>
  )
}