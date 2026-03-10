/**
 * Supabase Server Client
 * Server Component'larda ve API Route'larda kullanılır.
 * Cookie'den session okur — her request için fresh instance.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()             { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component'ta set edilemez — middleware halleder
          }
        },
      },
    }
  )
}

/**
 * Admin Client — service_role key ile.
 * SADECE server-side'da, kullanıcı yetki kontrolünü bypass etmek için.
 * RLS'i atlar — dikkatli kullan!
 */
export async function getSupabaseAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll()             { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* ignore */ }
        },
      },
    }
  )
}

/**
 * Mevcut kullanıcıyı server-side al.
 * DB profilini döndürür: { id, full_name, phone, role, is_active, ... }
 * Null dönerse redirect('/giris') yapılmalı.
 *
 * Rol kontrolü:
 *   user.role === 'admin'  → admin
 *   user.role === 'chef'   → aşçı
 *   user.role === 'buyer'  → alıcı
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient()

  // Önce auth session'ı doğrula
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) return null

  // Sonra DB profilini çek
  const { data: profile, error: dbError } = await supabase
    .from('users')
    .select('id, full_name, phone, role, avatar_url, is_active, platform_credit, fcm_token, created_at')
    .eq('id', authUser.id)
    .single()

  if (dbError || !profile) return null

  // Aktif değilse erişimi kes
  if (!profile.is_active) return null

  return profile
}

/**
 * Sadece auth.getUser() — session doğrulaması için.
 * Role metadata Supabase Auth'ta saklıysa buradan okunur.
 * Genellikle middleware'de yeterli; API route'larda getCurrentUser tercih edilmeli.
 */
export async function getAuthUser() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Chef profilini de dahil ederek kullanıcı al.
 * Aşçı dashboard ve menü route'larında kullanılır.
 */
export async function getCurrentChef() {
  const supabase = await getSupabaseServerClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data } = await supabase
    .from('users')
    .select(`
      id, full_name, phone, role, is_active,
      chef_profiles ( id, verification_status, is_active )
    `)
    .eq('id', authUser.id)
    .eq('role', 'chef')
    .single()

  if (!data) return null

  const chef = (data.chef_profiles as any)?.[0]
  if (!chef || chef.verification_status !== 'approved') return null

  return { ...data, chef_id: chef.id }
}
