// app/(buyer)/profil/page.tsx - Server Component
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import ProfilForm from './ProfilForm'
export const dynamic = 'force-dynamic'
export default async function ProfilPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  let chefProfile = null
  if (profile?.role === 'chef') {
    const { data: cp } = await supabase
      .from('chef_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    chefProfile = cp
  }
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', (user.email ?? '').toLowerCase())
    .single()
  const isAdmin = !!adminUser
  const userData = {
    id: user.id,
    email: user.email ?? '',
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    role: profile?.role ?? 'buyer',
  }
  const chefData = chefProfile ? {
    bio: chefProfile.bio ?? '',
    iban: chefProfile.iban ?? '',
    delivery_radius_km: chefProfile.delivery_radius_km ?? 5,
    min_order_amount: chefProfile.min_order_amount ?? 40,
  } : null
  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', marginBottom: 20 }}>
          Profil & Ayarlar
        </h1>
        <ProfilForm user={userData} chefData={chefData} isAdmin={isAdmin} />
      </div>
    </div>
  )
}