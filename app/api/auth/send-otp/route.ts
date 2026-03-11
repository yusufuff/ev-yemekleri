// @ts-nocheck
/**
 * POST /api/auth/send-otp
 * Telefon numarasına Netgsm üzerinden OTP gönderir.
 * Redis'e 3 dakika TTL ile kaydeder.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// â”€â”€â”€ Validasyon şeması â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const schema = z.object({
  phone: z
    .string()
    .regex(/^(\+90|0)?[5][0-9]{9}$/, 'Geçerli bir Türkiye telefon numarası girin'),
})

// â”€â”€â”€ Rate limiter (IP başına saatte 3 OTP) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.fixedWindow(3, '1 h'),
  analytics: true,
})

// â”€â”€â”€ Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(req: NextRequest) {
  try {
    // 1. Body parse + validasyon
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    // 2. Telefon numarasını normalize et (+90 formatına)
    let { phone } = parsed.data
    if (phone.startsWith('0')) phone = '+90' + phone.slice(1)
    if (!phone.startsWith('+')) phone = '+90' + phone

    // 3. Rate limit kontrolü (IP bazlı)
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const { success: allowed } = await ratelimit.limit(`otp:ip:${ip}`)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Çok fazla deneme. Lütfen 1 saat sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    // 4. OTP üret
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 5. Redis'e kaydet (3 dakika TTL)
    const key = `otp:${phone}`
    await redis.setex(key, 180, JSON.stringify({
      code,
      attempts: 0,
      createdAt: Date.now(),
    }))

    // 6. Netgsm SMS gönder
    const smsResponse = await fetch('https://api.netgsm.com.tr/sms/send/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usercode:   process.env.NETGSM_USERCODE,
        password:   process.env.NETGSM_PASSWORD,
        msgheader:  process.env.NETGSM_MSGHEADER ?? 'EVYEMEKLERI',
        message:    `EV YEMEKLERİ doğrulama kodunuz: ${code}. Bu kod 3 dakika geçerlidir.`,
        gsm:        phone.replace('+', ''),
      }),
    })

    if (!smsResponse.ok) {
      console.error('Netgsm SMS hatası:', await smsResponse.text())
      return NextResponse.json(
        { error: 'SMS gönderilemedi. Lütfen tekrar deneyin.' },
        { status: 502 }
      )
    }

    // Production'da kodu loglamayın "” geliştirme ortamı için:
    if (process.env.NODE_ENV === 'development') {
      console.log(`ğŸ”‘ OTP [${phone}]: ${code}`)
    }

    return NextResponse.json({ success: true, message: 'Doğrulama kodu gönderildi.' })

  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}


