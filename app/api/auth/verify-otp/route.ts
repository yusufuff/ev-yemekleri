// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json({ error: 'Telefon ve kod gerekli.' }, { status: 400 })
    }

    // Test modu: 123456 her zaman geçer
    const isTestCode = code === '123456'

    if (!isTestCode) {
      const { data: otpRecord } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('phone', phone)
        .single()

      if (!otpRecord) {
        return NextResponse.json(
          { error: 'Kod bulunamadı veya süresi dolmuş. Yeni kod isteyin.' },
          { status: 400 }
        )
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
        return NextResponse.json({ error: 'Kodun süresi dolmuş. Yeni kod isteyin.' }, { status: 400 })
      }

      if (otpRecord.attempts >= 3) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
        return NextResponse.json({ error: 'Çok fazla hatalı deneme. Yeni kod isteyin.' }, { status: 429 })
      }

      if (otpRecord.code !== code) {
        await supabaseAdmin
          .from('otp_codes')
          .update({ attempts: otpRecord.attempts + 1 })
          .eq('phone', phone)
        const remaining = 3 - otpRecord.attempts - 1
        return NextResponse.json({ error: `Hatalı kod. ${remaining} deneme hakkınız kaldı.` }, { status: 400 })
      }

      await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
    }

    // Kullanıcı bilgileri
    const fakeEmail = `${phone.replace('+', '')}@phone.evyemekleri.internal`
    const fakePassword = `EVY_${phone.replace('+', '')}_2025`

    // Kullanıcı var mı?
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('phone', phone)
      .single()

    let isNewUser = false
    let userRole = 'buyer'

    if (!existingUser) {
      // Yeni kullanıcı oluştur
      isNewUser = true

      // Önce auth user oluştur
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: fakePassword,
        email_confirm: true,
        user_metadata: { phone, role: 'buyer', full_name: '' },
      })

      if (authError) {
        // Zaten varsa güncelle
        console.log('Auth user zaten var, devam ediliyor:', authError.message)
      }
    } else {
      userRole = existingUser.role
    }

    // Email/password ile giriş yap → session al
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    })

    if (signInError || !signInData.session) {
      console.error('SignIn hatası:', signInError)
      return NextResponse.json({ error: 'Oturum açılamadı. Lütfen tekrar deneyin.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      role: userRole,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}