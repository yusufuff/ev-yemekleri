// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req: NextRequest) {
  try {
    const { full_name, phone, password, role } = await req.json()

    if (!full_name || !phone || !password || !role) {
      return NextResponse.json({ error: 'Tüm alanlar zorunlu.' }, { status: 400 })
    }

    const fakeEmail = `${phone.replace('+', '')}@phone.evyemekleri.internal`

    // Kullanici zaten var mi?
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Bu telefon numarası zaten kayıtlı. Giriş yapmayı deneyin.' }, { status: 409 })
    }

    // Auth kullanici olustur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role },
    })

    if (authError) {
      if (authError.message.includes('already')) {
        return NextResponse.json({ error: 'Bu telefon numarası zaten kayıtlı.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Hesap oluşturulamadı: ' + authError.message }, { status: 500 })
    }

    const userId = authData.user.id

    // users tablosuna kaydet
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        full_name,
        phone,
        role,
        is_active: true,
      }, { onConflict: 'id' })

    if (upsertError) {
      console.error('upsert error:', upsertError)
    }

    // Chef ise chef_profiles olustur
    if (role === 'chef') {
      await supabaseAdmin.from('chef_profiles').upsert({
        user_id: userId,
        verification_status: 'pending',
        is_active: false,
      }, { onConflict: 'user_id' })
    }

    // Session al
    const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: fakeEmail,
      password,
    })

    if (signInError || !signInData.session) {
      return NextResponse.json({ error: 'Hesap oluşturuldu fakat giriş yapılamadı.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      role,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    })

  } catch (err) {
    console.error('register error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}