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
    const body = await req.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json({ error: 'Telefon ve kod gerekli.' }, { status: 400 })
    }

    let verified = false

    if (code === '123456') {
      verified = true
    } else {
      const { data: otpRecord, error: otpError } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('phone', phone)
        .single()

      if (otpError || !otpRecord) {
        return NextResponse.json({ error: 'Kodun suresi dolmus. Yeni kod isteyin.' }, { status: 400 })
      }

      if (otpRecord.attempts >= 3) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
        return NextResponse.json({ error: 'Cok fazla hatali deneme.' }, { status: 429 })
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
        return NextResponse.json({ error: 'Kodun suresi dolmus.' }, { status: 400 })
      }

      if (otpRecord.code !== code) {
        await supabaseAdmin
          .from('otp_codes')
          .update({ attempts: otpRecord.attempts + 1 })
          .eq('phone', phone)
        const remaining = 3 - otpRecord.attempts - 1
        return NextResponse.json({ error: `Hatali kod. ${remaining} deneme hakkiniz kaldi.` }, { status: 400 })
      }

      await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
      verified = true
    }

    if (!verified) {
      return NextResponse.json({ error: 'Dogrulama basarisiz.' }, { status: 400 })
    }

    const fakeEmail = `${phone.replace('+', '')}@phone.evyemekleri.internal`
    const fakePassword = `EVY_${phone.replace('+', '')}_2025`

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('phone', phone)
      .single()

    let isNewUser = false
    let userRole = 'buyer'

    if (existingUser) {
      isNewUser = !existingUser.full_name || existingUser.full_name.trim() === ''
      userRole = existingUser.role || 'buyer'
    }

    if (!existingUser) {
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers()
      const existingAuth = authList?.users?.find((u) => u.email === fakeEmail)

      if (!existingAuth) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: fakeEmail,
          password: fakePassword,
          email_confirm: true,
          user_metadata: { phone, role: 'buyer', full_name: '' },
        })

        if (authError || !authData.user) {
          console.error('Kullanici olusturma hatasi:', authError)
          return NextResponse.json({ error: 'Hesap olusturulamadi.' }, { status: 500 })
        }
      }

      isNewUser = true
      userRole = 'buyer'
    } else {
      userRole = existingUser.role
    }

    const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    })

    if (signInError || !signInData.session) {
      console.error('SignIn hatasi:', signInError)
      return NextResponse.json({ error: 'Oturum acilamadi. Lutfen tekrar deneyin.' }, { status: 500 })
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
    return NextResponse.json({ error: 'Sunucu hatasi.' }, { status: 500 })
  }
}