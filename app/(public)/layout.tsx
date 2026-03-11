// @ts-nocheck
import Link from 'next/link'
import { BottomNav } from '@/components/layout/BottomNav'
import { getCurrentUser } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser() as any

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <nav className="bg-white border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-serif font-black text-lg text-[#4A2C0E]">
            EV YEMEKLERİ
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3 text-sm">
                <Link href="/kesif" className="text-[#8A7B6B] hover:text-[#4A2C0E] font-medium hidden sm:block">Keşfet</Link>
                <Link href="/siparislerim" className="text-[#8A7B6B] hover:text-[#4A2C0E] font-medium hidden sm:block">Siparişlerim</Link>
                <div className="w-8 h-8 rounded-full bg-[#E8622A] flex items-center justify-center text-white text-sm font-bold">
                  {user.full_name?.charAt(0).toUpperCase() ?? '?'}
                </div>
              </div>
            ) : (
              <>
                <Link href="/giris" className="px-3 py-1.5 text-xs font-semibold text-[#4A2C0E] border border-[#E8E0D4] rounded-lg hover:border-[#E8622A] hover:text-[#E8622A] transition-colors hidden sm:inline-flex">
                  Giriş Yap
                </Link>
                <Link href="/giris" className="px-3 py-1.5 text-xs font-semibold text-white bg-[#E8622A] rounded-lg hover:bg-[#d4541e] transition-colors">
                  ✨ Aşçı Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6" style={{ paddingBottom: user ? 'calc(56px + env(safe-area-inset-bottom, 0px) + 24px)' : undefined }}>
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