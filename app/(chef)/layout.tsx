import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'AÅŸÃ§Ä± Paneli â€” Ev Yemekleri',
}

export default async function ChefLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth + role korumasÄ±
  const user = await getCurrentUser() as any

  if (!user) {
    redirect('/giris?redirect=/dashboard')
  }

  if (user.role !== 'chef' && user.role !== 'admin') {
    redirect('/?error=unauthorized')
  }

  return <>{children}</>
}
