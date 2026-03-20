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
  const [user, setUser] = useState<{full_name?: string; role?: string} | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (hidden) return
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const meta = data.user.user_metadata
        setUser({ full_name: meta?.full_name || data.user.email?.split('@')[0], role: meta?.role })

        // Okunmamis bildirim sayisini cek
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', data.user.id)
          .eq('is_read', false)
          .then(({ count }) => {
            setUnreadCount(count ?? 0)
          })
          .catch(() => {})
      }
    })
  }, [hidden])

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

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

          {/* Bildirim zili */}
          {user && (
            <Link href="/bildirimler" style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:'50%', background:'#F5EDD8', textDecoration:'none' }}>
              <span style={{ fontSize:16 }}>🔔</span>
              {unreadCount > 0 && (
                <span style={{
                  position:'absolute', top:-2, right:-2,
                  background:'#E8622A', color:'white',
                  fontSize:9, fontWeight:700,
                  width:16, height:16, borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'#E8622A', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:700 }}>
                {user.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:'#4A2C0E', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.full_name}
              </span>
              <button onClick={handleLogout} style={{ padding:'6px 12px', fontSize:12, fontWeight:600, color:'#8A7B6B', border:'1.5px solid #E8E0D4', borderRadius:8, background:'white', cursor:'pointer', fontFamily:'inherit' }}>
                Cikis
              </button>
            </div>
          ) : (
            <>
              <Link href="/giris" style={{ padding:'7px 14px', fontSize:12, fontWeight:600, color:'#4A2C0E', border:'1.5px solid #E8E0D4', borderRadius:8, textDecoration:'none' }}>
                Giris Yap
              </Link>
              <Link href="/kayit" style={{ padding:'7px 14px', fontSize:12, fontWeight:700, color:'white', background:'#E8622A', borderRadius:8, textDecoration:'none' }}>
                Kayit Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}