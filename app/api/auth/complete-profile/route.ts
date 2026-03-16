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
    const { full_name, role } = body

    if (!full_name || full_name.trim().length < 3) {
      return NextResponse.json({ error: 'Ad en az 3 karakter olmali.' }, { status: 400 })
    }
    if (!role || !['buyer', 'chef'].includes(role)) {
      return NextResponse.json({ error: 'Gecersiz rol.' }, { status: 400 })
    }

    // Token'dan user al
    const authHeader = req.headers.get('Authorization')
    let userId = body.user_id

    if (!userId && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const { data } = await supabaseAdmin.auth.getUser(token)
      userId = data?.user?.id
    }

    // Cookie'den session dene
    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || ''
      const tokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/)
      if (tokenMatch) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(tokenMatch[1]))
          const accessToken = Array.isArray(tokenData) ? tokenData[0] : tokenData?.access_token
          if (accessToken) {
            const { data } = await supabaseAdmin.auth.getUser(accessToken)
            userId = data?.user?.id
          }
        } catch {}
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Oturum bulunamadi. Lutfen tekrar giris yapin.' }, { status: 401 })
    }

    // Auth user metadata güncelle
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: full_name.trim(), role }
    })

    // Phone'u auth'dan al
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const phone = authUser?.user?.user_metadata?.phone || authUser?.user?.phone || userId.slice(0, 10)

    // users tablosunu güncelle
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({ id: userId, full_name: full_name.trim(), role, phone }, { onConflict: 'id' })

    if (upsertError) {
      console.error('[complete-profile] upsert error:', upsertError)
      return NextResponse.json({ error: 'Profil kaydedilemedi: ' + upsertError.message }, { status: 500 })
    }

    // Aşçıysa chef_profiles oluştur
    if (role === 'chef') {
      await supabaseAdmin
        .from('chef_profiles')
        .upsert({ user_id: userId, verification_status: 'pending' }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ success: true, role })
  } catch (err: any) {
    console.error('[complete-profile] error:', err)
    return NextResponse.json({ error: 'Sunucu hatasi: ' + err.message }, { status: 500 })
  }
}