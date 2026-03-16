import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendSMS(phone: string, code: string): Promise<boolean> {
  // Netgsm entegrasyonu
  const username = process.env.NETGSM_USERNAME
  const password = process.env.NETGSM_PASSWORD
  const header   = process.env.NETGSM_HEADER ?? 'EVYEMEKLERI'

  if (!username || !password) {
    // SMS credentials yoksa sadece console'a yaz (dev/demo mod)
    console.log(`[OTP] ${phone} → ${code}`)
    return true
  }

  try {
    const msg = `Ev Yemekleri giris kodunuz: ${code}. Bu kodu kimseyle paylasmayiniz.`
    const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${username}&password=${password}&gsmno=${phone.replace('+90','').replace(/\s/g,'')}&message=${encodeURIComponent(msg)}&msgheader=${header}`
    const res = await fetch(url)
    const text = await res.text()
    return text.startsWith('00') || text.startsWith('01')
  } catch {
    console.log(`[OTP fallback] ${phone} → ${code}`)
    return true
  }
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone || phone.trim().length < 5) {
      return NextResponse.json({ error: 'Geçerli bir telefon numarası girin.' }, { status: 400 })
    }

    // Normalize phone
    const normalizedPhone = phone.trim().replace(/\s/g, '')

    // Rate limit — son 1 dakikada zaten gönderildiyse engelle
    const { data: existing } = await supabaseAdmin
      .from('otp_codes')
      .select('created_at')
      .eq('phone', normalizedPhone)
      .single()

    if (existing) {
      const diff = (Date.now() - new Date(existing.created_at).getTime()) / 1000
      if (diff < 60) {
        return NextResponse.json({ error: `Lütfen ${Math.ceil(60 - diff)} saniye bekleyin.` }, { status: 429 })
      }
    }

    const code      = generateOTP()
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()

    // otp_codes tablosuna kaydet
    await supabaseAdmin
      .from('otp_codes')
      .upsert({ phone: normalizedPhone, code, expires_at: expiresAt, attempts: 0, created_at: new Date().toISOString() })

    // SMS gönder
    await sendSMS(normalizedPhone, code)

    return NextResponse.json({ success: true, phone: normalizedPhone })
  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}