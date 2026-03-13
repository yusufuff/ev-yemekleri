// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[complete-profile] body:', JSON.stringify({ ...body, user_id: body.user_id ? 'present' : 'missing' }))

    const { full_name, role, user_id } = body

    if (!full_name || full_name.trim().length < 3) {
      return NextResponse.json({ error: 'Ad en az 3 karakter olmali.' }, { status: 400 })
    }

    if (!role || !['buyer', 'chef'].includes(role)) {
      return NextResponse.json({ error: 'Gecersiz rol.' }, { status: 400 })
    }

    let userId = user_id

    if (!userId) {
      const authHeader = req.headers.get('Authorization')
      console.log('[complete-profile] no user_id, checking auth header:', authHeader ? 'present' : 'missing')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const { data, error } = await supabaseAdmin.auth.getUser(token)
        console.log('[complete-profile] getUser result:', data?.user?.id, error?.message)
        userId = data?.user?.id
      }
    }

    console.log('[complete-profile] userId:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'Kullanici kimlik dogrulamasi basarisiz.' }, { status: 401 })
    }

    // Kullanicinin phone numarasini auth'dan al
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const phone = authUser?.user?.user_metadata?.phone || authUser?.user?.phone || ''

    console.log('[complete-profile] phone:', phone)

    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        full_name: full_name.trim(),
        role,
        phone,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    console.log('[complete-profile] upsert result:', upsertError ? upsertError.message : 'OK')

    if (upsertError) {
      return NextResponse.json({ error: 'Profil kaydedilemedi: ' + upsertError.message }, { status: 500 })
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: full_name.trim(), role },
    })

    if (role === 'chef') {
      await supabaseAdmin.from('chef_profiles').upsert({
        user_id: userId,
        verification_status: 'pending',
        is_active: false,
      }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ success: true, role })

  } catch (err) {
    console.error('[complete-profile] catch error:', err)
    return NextResponse.json({ error: 'Sunucu hatasi: ' + err.message }, { status: 500 })
  }
}