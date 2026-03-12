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
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Telefon numarası gerekli.' }, { status: 400 })
    }

    // OTP üret
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()

    // Supabase'e kaydet (otp_codes tablosu yoksa direkt test modu)
    try {
      await supabaseAdmin
        .from('otp_codes')
        .upsert({ phone, code, expires_at: expiresAt, attempts: 0 }, { onConflict: 'phone' })
    } catch (e) {
      // Tablo yoksa devam et
      console.log('otp_codes tablosu yok, test modunda devam ediliyor')
    }

    // Netgsm varsa SMS gönder
    const hasNetgsm = process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD

    if (hasNetgsm) {
      try {
        await fetch('https://api.netgsm.com.tr/sms/send/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usercode:  process.env.NETGSM_USERCODE,
            password:  process.env.NETGSM_PASSWORD,
            msgheader: process.env.NETGSM_MSGHEADER ?? 'EVYEMEKLERI',
            message:   `Ev Yemekleri dogrulama kodunuz: ${code}. 3 dakika gecerlidir.`,
            gsm:       phone.replace('+', ''),
          }),
        })
      } catch (e) {
        console.error('SMS hatası:', e)
      }
    } else {
      console.log(`🔑 TEST OTP [${phone}]: ${code}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu gönderildi.',
      // Test modunda kodu response'a ekle
      ...(!hasNetgsm && { testCode: code }),
    })

  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}