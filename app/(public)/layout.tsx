// @ts-nocheck
import Link from 'next/link'
import { BottomNav } from '@/components/layout/BottomNav'
import { CartButton } from '@/components/cart/CartButton'
import { getCurrentUser } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser() as any

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <nav className="bg-white border-b border-[#E8E0D4] sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-black text-lg text-[#4A2C0E] tracking-tight">EV YEMEKLERİ</span>
          </Link>

          {/* ORTA: NAV LİNKLER (masaüstü) */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#8A7B6B]">
            <Link href="/kesif" className="hover:text-[#4A2C0E] transition">Keşfet</Link>
            <Link href="/hakkimizda" className="hover:text-[#4A2C0E] transition">Hakkımızda</Link>
          </div>

          {/* SAĞ: SEPET + BUTONLAR */}
          <div className="flex items-center gap-2">

            {/* Sepet her zaman görünür */}
            <CartButton />

            {user ? (
              <div className="flex items-center gap-3 text-sm">
                <Link href="/kesif" className="text-[#8A7B6B] hover:text-[#4A2C0E] font-medium hidden sm:block">
                  Keşfet
                </Link>
                <Link href="/siparislerim" className="text-[#8A7B6B] hover:text-[#4A2C0E] font-medium hidden sm:block">
                  Siparişlerim
                </Link>
                <Link href="/profil" className="w-9 h-9 rounded-full bg-[#E8622A] flex items-center justify-center text-white font-bold hover:bg-[#d4541e] transition">
                  {user.full_name?.charAt(0).toUpperCase() ?? '?'}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/giris"
                  className="px-4 py-2 text-sm font-semibold text-[#4A2C0E] border border-[#E8E0D4] rounded-lg hover:border-[#E8622A] hover:text-[#E8622A] transition hidden sm:inline-flex"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/giris"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#E8622A] rounded-lg hover:bg-[#d4541e] transition"
                >
                  ✨ Aşçı Ol
                </Link>
              </div>
            )}
          </div>

        </div>
      </nav>

      <main style={{ paddingBottom: user ? 'calc(56px + env(safe-area-inset-bottom, 0px) + 24px)' : undefined }}>
        {children}
      </main>

      {user && (
        <div className="md:hidden">
          <BottomNav role={user.role as 'buyer' | 'chef' | 'admin' | null} />
        </div>
      )}
    </div>
  )
}