'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { CartButton } from '@/components/cart/CartButton'
import type { User } from '@/types/database'

interface HeaderProps {
  title:     string
  subtitle?: string
  user?:     User | null
  actions?:  React.ReactNode  // Sayfaya özel butonlar
}

export default function Header({ title, subtitle, user, actions }: HeaderProps) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-light px-8 py-4
                       flex items-center justify-between sticky top-0 z-50">
      {/* Sol: başlık */}
      <div>
        <h1 className="font-serif text-[22px] font-bold text-brown leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-gray mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Sağ: aksiyonlar + kullanıcı */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Sepet butonu — her zaman görünür */}
        <CartButton />

        {user ? (
          <div className="flex items-center gap-3">
            {/* Bildirim ikonu */}
            <Link
              href="/bildirimler"
              className="relative w-9 h-9 flex items-center justify-center
                         rounded-lg border border-gray-light hover:border-orange transition text-base"
            >
              🔔
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange rounded-full" />
            </Link>

            {/* Avatar + dropdown */}
            <div className="flex items-center gap-2 cursor-pointer group relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange to-orange-light
                              flex items-center justify-center text-white font-bold text-sm">
                {user.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-brown leading-tight">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-gray capitalize">{user.role}</div>
              </div>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg
                              border border-gray-light shadow-lg opacity-0 invisible
                              group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link
                  href="/profil"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-brown
                             hover:bg-cream transition rounded-t-lg"
                >
                  👤 Profilim
                </Link>
                {user?.role === 'chef' && <>
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm text-brown hover:bg-cream transition">
                    🍲 Panelim
                  </Link>
                  <Link href="/menu" className="flex items-center gap-2 px-4 py-3 text-sm text-brown hover:bg-cream transition">
                    📋 Menüm
                  </Link>
                  <Link href="/kazanc" className="flex items-center gap-2 px-4 py-3 text-sm text-brown hover:bg-cream transition">
                    💰 Kazancım
                  </Link>
                  <Link href="/asci-ayarlar" className="flex items-center gap-2 px-4 py-3 text-sm text-brown hover:bg-cream transition">
                    ⚙️ Aşçı Ayarları
                  </Link>
                </>}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-red-600
                             hover:bg-red-50 transition rounded-b-lg w-full text-left"
                >
                  🚪 Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/giris"   className="btn btn-ghost btn-sm">Giriş Yap</Link>
            <Link href="/kayit" className="btn btn-primary btn-sm">✨ Kayıt Ol</Link>
          </div>
        )}
      </div>
    </header>
  )
}