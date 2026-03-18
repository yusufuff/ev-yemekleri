// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function getUserIdFromCookies(cookieHeader: string): string | null {
  try {
    // Chunked format: sb-xxx-auth-token.0, sb-xxx-auth-token.1
    const chunks: string[] = []
    const chunkRegex = /sb-[^=]+-auth-token\.(\d+)=([^;]+)/g
    const matches = [...cookieHeader.matchAll(chunkRegex)]
    
    if (matches.length > 0) {
      // Chunk'lari siraya koy ve birlestir
      matches.sort((a, b) => parseInt(a[1]) - parseInt(b[1]))
      const combined = matches.map(m => decodeURIComponent(m[2])).join('')
      const tokenData = JSON.parse(combined)
      const accessToken = tokenData?.access_token
      return accessToken ? accessToken : null
    }

    // Eski format: sb-xxx-auth-token=...
    const singleMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/)
    if (singleMatch) {
      const tokenData = JSON.parse(decodeURIComponent(singleMatch[1]))
      const accessToken = Array.isArray(tokenData) ? tokenData[0] : tokenData?.access_token
      return accessToken ? accessToken : null
    }
  } catch {}
  return null
}

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

    let userId = body.user_id

    // 1) Authorization header
    if (!userId) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const { data } = await supabaseAdmin.auth.getUser(token)
        userId = data?.user?.id
      }
    }

    // 2) Cookie'den chunked token oku
    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || ''
      console.log('[complete-profile] cookie header length:', cookieHeader.length)
      const accessToken = getUserIdFromCookies(cookieHeader)
      if (accessToken) {
        const { data } = await supabaseAdmin.auth.getUser(accessToken)
        userId = data?.user?.id
        console.log('[complete-profile] userId from cookie:', userId)
      }
    }

    if (!userId) {
      console.error('[complete-profile] userId bulunamadi')
      return NextResponse.json({ error: 'Oturum bulunamadi. Lutfen tekrar giris yapin.' }, { status: 401 })
    }

    // Auth user metadata guncelle
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: full_name.trim(), role }
    })

    // Phone'u auth'dan al
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const phone = authUser?.user?.user_metadata?.phone || authUser?.user?.phone || userId.slice(0, 10)

    // users tablosunu guncelle
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({ id: userId, full_name: full_name.trim(), role, phone }, { onConflict: 'id' })

    if (upsertError) {
      console.error('[complete-profile] upsert error:', upsertError)
      return NextResponse.json({ error: 'Profil kaydedilemedi: ' + upsertError.message }, { status: 500 })
    }

    // Asciysa chef_profiles olustur
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