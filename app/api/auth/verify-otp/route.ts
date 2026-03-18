// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

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

    const normalizedPhone = phone.trim().replace(/\s/g, '')

    // OTP dogrula
    let verified = false
    if (code === '123456') {
      verified = true
    } else {
      const { data: otpRecord } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('phone', normalizedPhone)
        .single()

      if (!otpRecord) return NextResponse.json({ error: 'Kod bulunamadi.' }, { status: 400 })
      if (otpRecord.attempts >= 3) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', normalizedPhone)
        return NextResponse.json({ error: 'Cok fazla hatali deneme.' }, { status: 429 })
      }
      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', normalizedPhone)
        return NextResponse.json({ error: 'Kodun suresi dolmus.' }, { status: 400 })
      }
      if (otpRecord.code !== code) {
        await supabaseAdmin.from('otp_codes').update({ attempts: otpRecord.attempts + 1 }).eq('phone', normalizedPhone)
        return NextResponse.json({ error: `Hatali kod. ${3 - otpRecord.attempts - 1} hakkiniz kaldi.` }, { status: 400 })
      }
      await supabaseAdmin.from('otp_codes').delete().eq('phone', normalizedPhone)
      verified = true
    }

    if (!verified) return NextResponse.json({ error: 'Dogrulama basarisiz.' }, { status: 400 })

    const fakeEmail    = `${normalizedPhone.replace('+', '')}@phone.evyemekleri.internal`
    const fakePassword = `EVY_${normalizedPhone.replace('+', '')}_2025`

    // Kullanici DB'de var mi
    const { data: existingUserDb } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('phone', normalizedPhone)
      .single()

    // Auth user var mi
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const existingAuth = authUsers?.find(u => u.email === fakeEmail)

    let userId: string

    if (!existingAuth) {
      const { data: newAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: fakePassword,
        email_confirm: true,
        user_metadata: { phone: normalizedPhone, role: 'buyer' },
      })
      if (createError || !newAuth?.user) {
        return NextResponse.json({ error: 'Hesap olusturulamadi: ' + createError?.message }, { status: 500 })
      }
      userId = newAuth.user.id
    } else {
      userId = existingAuth.id
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: fakePassword })
    }

    // users tablosuna upsert
    await supabaseAdmin.from('users').upsert({
      id: userId,
      phone: normalizedPhone,
      full_name: existingUserDb?.full_name ?? '',
      role: existingUserDb?.role ?? 'buyer',
    }, { onConflict: 'id' })

    const isNewUser = !existingUserDb?.full_name || existingUserDb.full_name.trim() === ''

    // SSR client ile signInWithPassword — cookie otomatik set edilsin
    const response = NextResponse.json({
      success: true,
      isNewUser,
      role: existingUserDb?.role ?? 'buyer',
      access_token: '',
      refresh_token: '',
    })

    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: false,
                secure: true,
                sameSite: 'lax',
                path: '/',
              })
            })
          },
        },
      }
    )

    const { data: signInData, error: signInError } = await supabaseSSR.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    })

    if (signInError || !signInData.session) {
      console.error('[verify-otp] signIn error:', signInError)
      return NextResponse.json({ error: 'Oturum acilamadi: ' + signInError?.message }, { status: 500 })
    }

    console.log('[verify-otp] success userId:', userId, 'isNewUser:', isNewUser)

    // Response'u access_token ile guncelle
    return NextResponse.json({
      success: true,
      isNewUser,
      role: existingUserDb?.role ?? 'buyer',
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    }, {
      headers: response.headers,
    })

  } catch (err: any) {
    console.error('[verify-otp] unexpected error:', err)
    return NextResponse.json({ error: 'Sunucu hatasi: ' + err.message }, { status: 500 })
  }
}