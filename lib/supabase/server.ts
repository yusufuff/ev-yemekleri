// @ts-nocheck
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
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function getSupabaseAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    console.log('[getCurrentUser] authUser:', authUser?.id ?? 'null', 'error:', authError?.message ?? 'none')
    
    if (authError || !authUser) return null

    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('id, full_name, phone, role, avatar_url, is_active, platform_credit, fcm_token, created_at')
      .eq('id', authUser.id)
      .single()

    console.log('[getCurrentUser] profile:', profile?.id ?? 'null', 'dbError:', dbError?.message ?? 'none')

    if (dbError || !profile) return null
    if (!profile.is_active) return null

    return profile
  } catch (err: any) {
    console.error('[getCurrentUser] exception:', err.message)
    return null
  }
}

export async function getAuthUser() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

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