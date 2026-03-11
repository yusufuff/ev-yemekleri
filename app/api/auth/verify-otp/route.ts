// @ts-nocheck
/**
 * POST /api/auth/verify-otp
 * Redis'teki OTP'yi doÄŸrular, Supabase session oluÅŸturur.
 *
 * Flow:
 * 1. Redis'ten OTP kaydÄ±nÄ± al
 * 2. Kod eÅŸleÅŸiyor mu kontrol et (max 3 deneme)
 * 3. Supabase'de kullanÄ±cÄ±yÄ± upsert et (admin client)
 * 4. Session token dÃ¶ndÃ¼r â†’ client setSession() ile kullanÄ±r
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// â”€â”€ Validasyon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const schema = z.object({
  phone: z.string().regex(/^\+90[5][0-9]{9}$/, 'GeÃ§ersiz telefon formatÄ±'),
  code:  z.string().length(6).regex(/^\d{6}$/, 'Kod 6 haneli sayÄ± olmalÄ±'),
})

// â”€â”€ Redis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// â”€â”€ Supabase Admin (RLS bypass) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// â”€â”€ Helper: dev modunda sahte OTP kabul et â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function isDevMode() {
  return process.env.NODE_ENV === 'development'
}

// â”€â”€ Handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(req: NextRequest) {
  try {
    // 1. Validasyon
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { phone, code } = parsed.data
    const otpKey = `otp:${phone}`

    // 2. OTP doÄŸrulama
    let verified = false

    if (isDevMode() && (code === '123456' || code === '000000')) {
      // Dev modunda Ã¶zel kodlar her zaman geÃ§er
      verified = true
      console.log(`ğŸ”‘ Dev OTP bypass: ${phone} â†’ ${code}`)
    } else {
      // Redis'ten OTP kaydÄ±nÄ± al
      const record = await redis.get<{
        code: string
        attempts: number
        createdAt: number
      }>(otpKey)

      if (!record) {
        return NextResponse.json(
          { error: 'DoÄŸrulama kodunun sÃ¼resi dolmuÅŸ. LÃ¼tfen yeni kod isteyin.' },
          { status: 400 }
        )
      }

      // Maksimum deneme aÅŸÄ±ldÄ± mÄ±?
      if (record.attempts >= 3) {
        await redis.del(otpKey)
        return NextResponse.json(
          { error: 'Ã‡ok fazla hatalÄ± deneme. LÃ¼tfen yeni kod isteyin.' },
          { status: 429 }
        )
      }

      // Kod eÅŸleÅŸiyor mu?
      if (record.code !== code) {
        // Deneme sayÄ±sÄ±nÄ± artÄ±r
        await redis.setex(otpKey, await redis.ttl(otpKey), JSON.stringify({
          ...record,
          attempts: record.attempts + 1,
        }))

        const remaining = 3 - record.attempts - 1
        return NextResponse.json(
          {
            error: `HatalÄ± kod. ${remaining > 0 ? `${remaining} deneme hakkÄ±nÄ±z kaldÄ±.` : 'Son denemeniz de baÅŸarÄ±sÄ±z oldu, yeni kod isteyin.'}`,
            attemptsLeft: remaining,
          },
          { status: 400 }
        )
      }

      // BaÅŸarÄ±lÄ± â€” Redis kaydÄ±nÄ± sil
      await redis.del(otpKey)
      verified = true
    }

    if (!verified) {
      return NextResponse.json({ error: 'DoÄŸrulama baÅŸarÄ±sÄ±z.' }, { status: 400 })
    }

    // 3. Supabase'de kullanÄ±cÄ± var mÄ± kontrol et
    //    Supabase phone auth: phone numarasÄ±na gÃ¶re kullanÄ±cÄ± ara
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('phone', phone)
      .single()

    let userId: string
    let isNewUser: boolean
    let userRole: string

    if (existingUsers) {
      // Mevcut kullanÄ±cÄ±
      userId    = existingUsers.id
      isNewUser = false
      userRole  = existingUsers.role
    } else {
      // Yeni kullanÄ±cÄ± â€” Supabase Auth'da oluÅŸtur
      // Email trick: phone bazlÄ± sahte email (internal kullanÄ±m)
      const fakeEmail = `${phone.replace('+', '')}@phone.evyemekleri.internal`

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email:            fakeEmail,
        phone:            phone,
        email_confirm:    true,
        phone_confirm:    true,
        user_metadata: {
          phone,
          role: 'buyer',   // Default â€” profil adÄ±mÄ±nda gÃ¼ncellenir
          full_name: '',
        },
      })

      if (authError || !authData.user) {
        console.error('Auth kullanÄ±cÄ± oluÅŸturma hatasÄ±:', authError)
        return NextResponse.json(
          { error: 'Hesap oluÅŸturulamadÄ±. LÃ¼tfen tekrar deneyin.' },
          { status: 500 }
        )
      }

      userId    = authData.user.id
      isNewUser = true
      userRole  = 'buyer'
    }

    // 4. Session token oluÅŸtur
    //    Admin API ile magic link Ã¼ret â†’ token'Ä± parse et
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type:  'magiclink',
      email: `${phone.replace('+', '')}@phone.evyemekleri.internal`,
    })

    if (linkError || !linkData) {
      console.error('Magic link hatasÄ±:', linkError)
      return NextResponse.json(
        { error: 'Oturum aÃ§Ä±lamadÄ±. LÃ¼tfen tekrar deneyin.' },
        { status: 500 }
      )
    }

    // action_link'ten token'Ä± Ã§Ä±kar
    // Format: ...auth/v1/verify?token=XXXX&type=magiclink&redirect_to=...
    const url          = new URL(linkData.properties.action_link)
    const accessToken  = url.searchParams.get('token')

    return NextResponse.json({
      success:     true,
      isNewUser,
      role:        userRole,
      userId,
      // Client bunlarÄ± supabase.auth.verifyOtp ile session'a dÃ¶nÃ¼ÅŸtÃ¼rÃ¼r
      token:       accessToken,
      tokenType:   'magiclink',
    })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Sunucu hatasÄ±.' }, { status: 500 })
  }
}


