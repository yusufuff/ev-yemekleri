'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const CartButton = dynamic(
  () => import('@/components/cart/CartButton').then(m => ({ default: m.CartButton })),
  { ssr: false }
)

const HIDDEN_PATHS = ['/giris', '/kayit', '/admin', '/dashboard']

export function PublicNavbar() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const hidden = HIDDEN_PATHS.some(p => pathname?.startsWith(p))
  useEffect(() => {
    if (hidden) return
    fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(data => { if (data?.user) setUser(data.user) }).catch(() => {})
  }, [hidden])
  if (hidden) return null
  return (
    <nav className="bg-white border-b border-[#E8E0D4] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif font-black text-lg text-[#4A2C0E]">EV YEMEKLERI</Link>
        <div className="flex items-center gap-2">
          <CartButton />
          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/kesif" className="text-[#8A7B6B] font-medium hidden sm:block">Kesfet</Link>
              <div className="w-8 h-8 rounded-full bg-[#E8622A] flex items-center justify-center text-white text-sm font-bold">
                {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
            </div>
          ) : (
            <>
              <Link href="/giris" className="px-3 py-1.5 text-xs font-semibold text-[#4A2C0E] border border-[#E8E0D4] rounded-lg hidden sm:inline-flex">Giris Yap</Link>
              <Link href="/kayit" className="px-3 py-1.5 text-xs font-semibold text-white bg-[#E8622A] rounded-lg">Kayit Ol</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}