// @ts-nocheck
/**
 * (buyer) grup layout â€” sipariÅŸlerim, mesajlar, favorilerim, adreslerim
 * GiriÅŸ zorunlu.
 */
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
import Link from 'next/link'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser() as any

  if (!user) {
    redirect('/giris?redirect=/siparislerim')
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <nav className="bg-white border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-serif font-black text-lg text-[#4A2C0E]">
            EV YEMEKLERÄ°
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/kesif" className="text-[#8A7B6B] hover:text-[#4A2C0E] font-medium hidden sm:block">KeÅŸfet</Link>
            <Link href="/siparislerim" className="text-[#8A7B6B] hover:text-[#4A2C0E] font-medium hidden sm:block">SipariÅŸlerim</Link>
            <div className="w-8 h-8 rounded-full bg-[#E8622A] flex items-center justify-center text-white text-sm font-bold">
              {user.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6"
            style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 24px)' }}>
        {children}
      </main>
      <div className="md:hidden">
        <BottomNav role={user.role as 'buyer' | 'chef' | 'admin' | null} />
      </div>
    </div>
  )
}
