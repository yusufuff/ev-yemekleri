// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getUser(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

  const { data: cp } = await supabaseAdmin
    .from('chef_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: u } = await supabaseAdmin
    .from('users')
    .select('full_name, phone, avatar_url')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ profile: cp, user: u })
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

  const body = await req.json()

  const { data: cp } = await supabaseAdmin
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!cp) return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 404 })

  // chef_profiles güncelle
  const cpUpdates: any = {}
  if (body.bio              !== undefined) cpUpdates.bio              = body.bio
  if (body.location_approx  !== undefined) cpUpdates.location_approx  = body.location_approx
  if (body.delivery_types   !== undefined) cpUpdates.delivery_types   = body.delivery_types
  if (body.delivery_radius_km !== undefined) cpUpdates.delivery_radius_km = body.delivery_radius_km
  if (body.working_hours    !== undefined) cpUpdates.working_hours    = body.working_hours
  if (body.kitchen_types    !== undefined) cpUpdates.kitchen_types    = body.kitchen_types
  if (body.is_open          !== undefined) cpUpdates.is_open          = body.is_open

  if (Object.keys(cpUpdates).length > 0) {
    await supabaseAdmin.from('chef_profiles').update(cpUpdates).eq('id', cp.id)
  }

  // users tablosu güncelle
  const userUpdates: any = {}
  if (body.full_name !== undefined) userUpdates.full_name = body.full_name

  if (Object.keys(userUpdates).length > 0) {
    await supabaseAdmin.from('users').update(userUpdates).eq('id', user.id)
  }

  return NextResponse.json({ success: true })
}