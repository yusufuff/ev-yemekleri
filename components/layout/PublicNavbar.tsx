// @ts-nocheck
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const CartButton = dynamic(
  () => import('@/components/cart/CartButton').then(m => ({ default: m.CartButton })),
  { ssr: false }
)

const PUBLIC_LINKS = [
  { href: '/kesif',   label: 'Keşfet'      },
  { href: '/asci-ol', label: 'Aşçı Ol 🍳' },
]

const AUTH_LINKS = [
  { href: '/davet',        label: '🎁 Davet Et',  roles: ['buyer','chef','admin'] },
  { href: '/siparislerim', label: 'Siparişlerim', roles: ['buyer','chef','admin'] },
  { href: '/mesajlar',     label: 'Mesajlar',     roles: ['buyer','chef','admin'] },
  { href: '/favorilerim',  label: 'Favoriler',    roles: ['buyer','admin']        },
  { href: '/dashboard',    label: 'Panel',        roles: ['chef','admin']         },
  { href: '/profil',       label: 'Profil',       roles: ['buyer','chef','admin'] },
]

const HIDDEN_PATHS = ['/giris', '/kayit', '/admin']

export function PublicNavbar() {
  const pathname = usePathname()
  const hidden = HIDDEN_PATHS.some(p => pathname?.startsWith(p))
  const [user, setUser] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (hidden) { setLoaded(true); return }
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        supabase
          .from('users')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            setUser({
              full_name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
              role: profile?.role ?? data.user.user_metadata?.role,
            })
            setLoaded(true)
          })
      } else {
        setLoaded(true)
      }
    })
  }, [hidden])

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (hidden) return null

  const visibleLinks = [
    ...PUBLIC_LINKS,
    ...(user ? AUTH_LINKS.filter(l => l.roles.includes(user.role ?? 'buyer')) : []),
  ]

  const mobileNav = [
    { href: '/',             icon: '🏠', label: 'Ana Sayfa' },
    { href: '/kesif',        icon: '🗺️', label: 'Keşfet'   },
    ...(user
      ? [
          { href: '/siparislerim', icon: '📦', label: 'Siparişler' },
          { href: '/profil',       icon: '👤', label: 'Profil'     },
        ]
      : [
          { href: '/giris',  icon: '🔑', label: 'Giriş' },
          { href: '/kayit',  icon: '✨', label: 'Kayıt' },
        ]
    ),
  ]

  return (
    <>
      <nav style={{ background:'white', borderBottom:'1px solid #E8E0D4', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1152, margin:'0 auto', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link href="/" style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color:'#4A2C0E', textDecoration:'none' }}>
            EV YEMEKLERİ
          </Link>

          <div style={{ display:'flex', alignItems:'center', gap:20 }} className="hidden-mobile">
            {visibleLinks.map(item => {
              const active = pathname?.startsWith(item.href)
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
            <Link href="/ara" className="mobile-only" style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              width:36, height:36, borderRadius:10, background:'#F3EDE4',
              textDecoration:'none', fontSize:18,
            }}>🔍</Link>

            <CartButton />

            {loaded && (user ? (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'#E8622A', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:700 }}>
                  {user.full_name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <span className="hidden-mobile" style={{ fontSize:13, fontWeight:600, color:'#4A2C0E', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user.full_name}
                </span>
                <button onClick={handleLogout} style={{ padding:'6px 12px', fontSize:12, fontWeight:600, color:'#8A7B6B', border:'1.5px solid #E8E0D4', borderRadius:8, background:'white', cursor:'pointer', fontFamily:'inherit' }}>
                  Çıkış
                </button>
              </div>
            ) : (
              <>
                <Link href="/giris" className="hidden-mobile" style={{ padding:'7px 14px', fontSize:12, fontWeight:600, color:'#4A2C0E', border:'1.5px solid #E8E0D4', borderRadius:8, textDecoration:'none' }}>
                  Giriş Yap
                </Link>
                <Link href="/kayit" style={{ padding:'7px 14px', fontSize:12, fontWeight:700, color:'white', background:'#E8622A', borderRadius:8, textDecoration:'none' }}>
                  ✨ Kayıt Ol
                </Link>
              </>
            ))}
          </div>
        </div>
      </nav>

      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:200,
        background:'white', borderTop:'1px solid #E8E0D4',
        display:'flex', alignItems:'center',
        paddingBottom:'env(safe-area-inset-bottom, 0px)',
      }} className="mobile-bottom-nav">
        {mobileNav.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', padding:'8px 4px', textDecoration:'none', gap:2,
            }}>
              <span style={{ fontSize:20 }}>{item.icon}</span>
              <span style={{ fontSize:10, fontWeight: isActive ? 700 : 500, color: isActive ? '#E8622A' : '#8A7B6B' }}>
                {item.label}
              </span>
              {isActive && <div style={{ width:4, height:4, borderRadius:'50%', background:'#E8622A', marginTop:2 }} />}
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .mobile-only   { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .mobile-only   { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}