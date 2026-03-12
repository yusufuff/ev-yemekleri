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
    const { full_name, role, user_id } = body

    if (!full_name || full_name.trim().length < 3) {
      return NextResponse.json({ error: 'Ad en az 3 karakter olmali.' }, { status: 400 })
    }

    if (!role || !['buyer', 'chef'].includes(role)) {
      return NextResponse.json({ error: 'Gecersiz rol.' }, { status: 400 })
    }

    // user_id yoksa Authorization header'dan al
    let userId = user_id

    if (!userId) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const { data } = await supabaseAdmin.auth.getUser(token)
        userId = data?.user?.id
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Kullanici kimlik dogrulamasi basarisiz.' }, { status: 401 })
    }

    // users tablosunu guncelle veya olustur
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        full_name: full_name.trim(),
        role,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (upsertError) {
      console.error('upsert error:', upsertError)
      return NextResponse.json({ error: 'Profil kaydedilemedi.' }, { status: 500 })
    }

    // Auth metadata guncelle
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: full_name.trim(), role },
    })

    // Chef ise chef_profiles olustur
    if (role === 'chef') {
      await supabaseAdmin.from('chef_profiles').upsert({
        user_id: userId,
        verification_status: 'pending',
        is_active: false,
      }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ success: true, role })

  } catch (err) {
    console.error('complete-profile error:', err)
    return NextResponse.json({ error: 'Sunucu hatasi.' }, { status: 500 })
  }
}