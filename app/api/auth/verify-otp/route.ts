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
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Telefon ve kod gerekli.' }, { status: 400 })
    }

    // Normalize phone
    const normalizedPhone = (phone.startsWith('+90') ? phone : '+90' + phone.replace(/^0/, '')).replace(/\s/g, '')

    // OTP doğrula (123456 her zaman geçerli - test)
    let verified = false

    if (code === '123456') {
      verified = true
    } else {
      const { data: otpRecord } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('phone', normalizedPhone)
        .single()

      if (!otpRecord) {
        return NextResponse.json({ error: 'Kod bulunamadı. Yeni kod isteyin.' }, { status: 400 })
      }
      if (otpRecord.attempts >= 3) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', normalizedPhone)
        return NextResponse.json({ error: 'Çok fazla hatalı deneme.' }, { status: 429 })
      }
      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', normalizedPhone)
        return NextResponse.json({ error: 'Kodun süresi dolmuş.' }, { status: 400 })
      }
      if (otpRecord.code !== code) {
        await supabaseAdmin.from('otp_codes').update({ attempts: otpRecord.attempts + 1 }).eq('phone', normalizedPhone)
        return NextResponse.json({ error: `Hatalı kod. ${3 - otpRecord.attempts - 1} hakkınız kaldı.` }, { status: 400 })
      }
      await supabaseAdmin.from('otp_codes').delete().eq('phone', normalizedPhone)
      verified = true
    }

    if (!verified) {
      return NextResponse.json({ error: 'Doğrulama başarısız.' }, { status: 400 })
    }

    const fakeEmail    = `${normalizedPhone.replace('+', '')}@phone.evyemekleri.internal`
    const fakePassword = `EVY_${normalizedPhone.replace('+', '')}_2025`

    // Kullanıcı var mı kontrol et
    const { data: existingUserDb } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('phone', normalizedPhone)
      .single()

    // Auth user var mı kontrol et
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const existingAuth = authUsers?.find(u => u.email === fakeEmail)

    let isNewUser = false
    let userId: string

    if (!existingAuth) {
      // Yeni auth kullanıcısı oluştur
      const { data: newAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: fakePassword,
        email_confirm: true,
        user_metadata: { phone: normalizedPhone, role: 'buyer' },
      })

      if (createError || !newAuth?.user) {
        console.error('[verify-otp] createUser error:', createError)
        return NextResponse.json({ error: 'Hesap oluşturulamadı: ' + createError?.message }, { status: 500 })
      }

      userId = newAuth.user.id
      isNewUser = true
    } else {
      userId = existingAuth.id
      // Şifreyi güncelle (her seferinde sync et)
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: fakePassword })
      isNewUser = !existingUserDb?.full_name
    }

    // users tablosuna upsert
    await supabaseAdmin.from('users').upsert({
      id: userId,
      phone: normalizedPhone,
      full_name: existingUserDb?.full_name ?? '',
      role: existingUserDb?.role ?? 'buyer',
    }, { onConflict: 'id' })

    // Oturum aç
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: fakeEmail,
    })

    if (signInError || !signInData) {
      console.error('[verify-otp] generateLink error:', signInError)
      // Fallback: signInWithPassword dene
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const { data: pwData, error: pwError } = await anonClient.auth.signInWithPassword({
        email: fakeEmail,
        password: fakePassword,
      })
      if (pwError || !pwData.session) {
        console.error('[verify-otp] signInWithPassword error:', pwError)
        return NextResponse.json({ error: 'Oturum açılamadı.' }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        isNewUser,
        role: existingUserDb?.role ?? 'buyer',
        access_token: pwData.session.access_token,
        refresh_token: pwData.session.refresh_token,
      })
    }

    // Token'ı al
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: pwData, error: pwError } = await anonClient.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    })

    if (pwError || !pwData.session) {
      console.error('[verify-otp] final signIn error:', pwError)
      return NextResponse.json({ error: 'Oturum açılamadı: ' + pwError?.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      role: existingUserDb?.role ?? 'buyer',
      access_token: pwData.session.access_token,
      refresh_token: pwData.session.refresh_token,
    })

  } catch (err: any) {
    console.error('[verify-otp] unexpected error:', err)
    return NextResponse.json({ error: 'Sunucu hatası: ' + err.message }, { status: 500 })
  }
}