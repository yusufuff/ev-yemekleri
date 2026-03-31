import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

  const body = await req.json()
  const { full_name, phone, email, bio, iban, delivery_radius_km, min_order_amount } = body

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      full_name,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  if (email && email !== user.email) {
    await supabaseAdmin.auth.admin.updateUserById(user.id, { email })
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'chef') {
    await supabaseAdmin
      .from('chef_profiles')
      .update({
        bio,
        iban,
        delivery_radius_km,
        min_order_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}