// @ts-nocheck
/**
 * Admin Layout
 * Sadece role === 'admin' erişebilir (middleware çift kontrol).
 */
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = { title: 'Admin Panel "” Ev Yemekleri' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen bg-[#0F0D0A]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
