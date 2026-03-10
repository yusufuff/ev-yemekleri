/**
 * POST /api/auth/verify-otp
 * Redis'teki OTP'yi doğrular, Supabase session oluşturur.
 *
 * Flow:
 * 1. Redis'ten OTP kaydını al
 * 2. Kod eşleşiyor mu kontrol et (max 3 deneme)
 * 3. Supabase'de kullanıcıyı upsert et (admin client)
 * 4. Session token döndür → client setSession() ile kullanır
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ── Validasyon ────────────────────────────────────────────────────────────────
const schema = z.object({
  phone: z.string().regex(/^\+90[5][0-9]{9}$/, 'Geçersiz telefon formatı'),
  code:  z.string().length(6).regex(/^\d{6}$/, 'Kod 6 haneli sayı olmalı'),
})

// ── Redis ─────────────────────────────────────────────────────────────────────
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ── Supabase Admin (RLS bypass) ───────────────────────────────────────────────
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Helper: dev modunda sahte OTP kabul et ────────────────────────────────────
function isDevMode() {
  return process.env.NODE_ENV === 'development'
}

// ── Handler ───────────────────────────────────────────────────────────────────
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

    // 2. OTP doğrulama
    let verified = false

    if (isDevMode() && (code === '123456' || code === '000000')) {
      // Dev modunda özel kodlar her zaman geçer
      verified = true
      console.log(`🔑 Dev OTP bypass: ${phone} → ${code}`)
    } else {
      // Redis'ten OTP kaydını al
      const record = await redis.get<{
        code: string
        attempts: number
        createdAt: number
      }>(otpKey)

      if (!record) {
        return NextResponse.json(
          { error: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni kod isteyin.' },
          { status: 400 }
        )
      }

      // Maksimum deneme aşıldı mı?
      if (record.attempts >= 3) {
        await redis.del(otpKey)
        return NextResponse.json(
          { error: 'Çok fazla hatalı deneme. Lütfen yeni kod isteyin.' },
          { status: 429 }
        )
      }

      // Kod eşleşiyor mu?
      if (record.code !== code) {
        // Deneme sayısını artır
        await redis.setex(otpKey, await redis.ttl(otpKey), JSON.stringify({
          ...record,
          attempts: record.attempts + 1,
        }))

        const remaining = 3 - record.attempts - 1
        return NextResponse.json(
          {
            error: `Hatalı kod. ${remaining > 0 ? `${remaining} deneme hakkınız kaldı.` : 'Son denemeniz de başarısız oldu, yeni kod isteyin.'}`,
            attemptsLeft: remaining,
          },
          { status: 400 }
        )
      }

      // Başarılı — Redis kaydını sil
      await redis.del(otpKey)
      verified = true
    }

    if (!verified) {
      return NextResponse.json({ error: 'Doğrulama başarısız.' }, { status: 400 })
    }

    // 3. Supabase'de kullanıcı var mı kontrol et
    //    Supabase phone auth: phone numarasına göre kullanıcı ara
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name')
      .eq('phone', phone)
      .single()

    let userId: string
    let isNewUser: boolean
    let userRole: string

    if (existingUsers) {
      // Mevcut kullanıcı
      userId    = existingUsers.id
      isNewUser = false
      userRole  = existingUsers.role
    } else {
      // Yeni kullanıcı — Supabase Auth'da oluştur
      // Email trick: phone bazlı sahte email (internal kullanım)
      const fakeEmail = `${phone.replace('+', '')}@phone.evyemekleri.internal`

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email:            fakeEmail,
        phone:            phone,
        email_confirm:    true,
        phone_confirm:    true,
        user_metadata: {
          phone,
          role: 'buyer',   // Default — profil adımında güncellenir
          full_name: '',
        },
      })

      if (authError || !authData.user) {
        console.error('Auth kullanıcı oluşturma hatası:', authError)
        return NextResponse.json(
          { error: 'Hesap oluşturulamadı. Lütfen tekrar deneyin.' },
          { status: 500 }
        )
      }

      userId    = authData.user.id
      isNewUser = true
      userRole  = 'buyer'
    }

    // 4. Session token oluştur
    //    Admin API ile magic link üret → token'ı parse et
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type:  'magiclink',
      email: `${phone.replace('+', '')}@phone.evyemekleri.internal`,
    })

    if (linkError || !linkData) {
      console.error('Magic link hatası:', linkError)
      return NextResponse.json(
        { error: 'Oturum açılamadı. Lütfen tekrar deneyin.' },
        { status: 500 }
      )
    }

    // action_link'ten token'ı çıkar
    // Format: ...auth/v1/verify?token=XXXX&type=magiclink&redirect_to=...
    const url          = new URL(linkData.properties.action_link)
    const accessToken  = url.searchParams.get('token')

    return NextResponse.json({
      success:     true,
      isNewUser,
      role:        userRole,
      userId,
      // Client bunları supabase.auth.verifyOtp ile session'a dönüştürür
      token:       accessToken,
      tokenType:   'magiclink',
    })

  } catch (err) {
    console.error('verify-otp error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
