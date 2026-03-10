import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Aşçı Paneli — Ev Yemekleri',
}

export default async function ChefLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth + role koruması
  const user = await getCurrentUser()

  if (!user) {
    redirect('/giris?redirect=/dashboard')
  }

  if (user.role !== 'chef' && user.role !== 'admin') {
    redirect('/?error=unauthorized')
  }

  return <>{children}</>
}
