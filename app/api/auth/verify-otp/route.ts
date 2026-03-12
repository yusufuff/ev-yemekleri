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
      // Supabase'den OTP kaydını al
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

      // Süre kontrolü
      if (new Date(otpRecord.expires_at) < new Date()) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
        return NextResponse.json(
          { error: 'Kodun süresi dolmuş. Yeni kod isteyin.' },
          { status: 400 }
        )
      }

      // Deneme kontrolü
      if (otpRecord.attempts >= 3) {
        await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
        return NextResponse.json(
          { error: 'Çok fazla hatalı deneme. Yeni kod isteyin.' },
          { status: 429 }
        )
      }

      // Kod eşleşiyor mu?
      if (otpRecord.code !== code) {
        await supabaseAdmin
          .from('otp_codes')
          .update({ attempts: otpRecord.attempts + 1 })
          .eq('phone', phone)

        const remaining = 3 - otpRecord.attempts - 1
        return NextResponse.json(
          { error: `Hatalı kod. ${remaining} deneme hakkınız kaldı.` },
          { status: 400 }
        )
      }

      // Başarılı - OTP sil
      await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)
    }

    // Kullanıcı var mı kontrol et
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('phone', phone)
      .single()

    let userId: string
    let isNewUser: boolean
    let userRole: string

    if (existingUser) {
      userId = existingUser.id
      isNewUser = false
      userRole = existingUser.role
    } else {
      // Yeni kullanıcı oluştur
      const fakeEmail = `${phone.replace('+', '')}@phone.evyemekleri.internal`

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        phone: phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, role: 'buyer', full_name: '' },
      })

      if (authError || !authData.user) {
        // Kullanıcı zaten varsa bul
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        const found = users.find(u => u.email === fakeEmail)
        if (found) {
          userId = found.id
          isNewUser = false
          userRole = 'buyer'
        } else {
          return NextResponse.json({ error: 'Hesap oluşturulamadı.' }, { status: 500 })
        }
      } else {
        userId = authData.user.id
        isNewUser = true
        userRole = 'buyer'
      }
    }

    // Magic link ile session token üret
    const fakeEmail = `${phone.replace('+', '')}@phone.evyemekleri.internal`
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: fakeEmail,
    })

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Oturum açılamadı.' }, { status: 500 })
    }

    const url = new URL(linkData.properties.action_link)
    const token = url.searchParams.get('token')

    return NextResponse.json({
      success: true,
      isNewUser,
      role: userRole,
      userId,
      token,
      tokenType: 'magiclink',
    })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}