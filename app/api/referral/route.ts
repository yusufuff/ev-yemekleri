// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET — kullanıcının referans kodunu ve istatistiklerini getir
export async function GET() {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('code, used_count')
    .eq('user_id', user.id)
    .single()

  const { data: usages } = await supabase
    .from('referral_usages')
    .select('referred_id, referrer_credit, created_at, users!referred_id(full_name)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('users')
    .select('platform_credit')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    code:           refCode?.code ?? null,
    used_count:     refCode?.used_count ?? 0,
    total_earned:   (usages ?? []).reduce((s: number, u: any) => s + (u.referrer_credit ?? 0), 0),
    platform_credit: profile?.platform_credit ?? 0,
    usages:         usages ?? [],
  })
}

// POST — referans kodu kullan (kayıt sonrası)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Kod gerekli' }, { status: 400 })

  // Zaten referans kullanmış mı?
  const { data: existing } = await supabase
    .from('referral_usages')
    .select('id')
    .eq('referred_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Zaten bir referans kodu kullandınız.' }, { status: 400 })

  // Kodu bul
  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('user_id, code')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (!refCode) return NextResponse.json({ error: 'Geçersiz referans kodu.' }, { status: 400 })

  // Kendi kodunu kullanamazsın
  if (refCode.user_id === user.id) {
    return NextResponse.json({ error: 'Kendi referans kodunuzu kullanamazsınız.' }, { status: 400 })
  }

  const REFERRER_CREDIT = 20  // Davet edene ₺20
  const REFERRED_CREDIT = 10  // Davet edilene ₺10

  // Kullanımı kaydet
  await supabase.from('referral_usages').insert({
    referrer_id:     refCode.user_id,
    referred_id:     user.id,
    code:            code.toUpperCase().trim(),
    referrer_credit: REFERRER_CREDIT,
    referred_credit: REFERRED_CREDIT,
  })

  // Referans veren kullanıcıya kredi ekle
  await supabase.rpc('increment_platform_credit', {
    user_id: refCode.user_id,
    amount:  REFERRER_CREDIT,
  })

  // Yeni kullanıcıya kredi ekle
  await supabase.rpc('increment_platform_credit', {
    user_id: user.id,
    amount:  REFERRED_CREDIT,
  })

  // Kullanım sayısını artır
  await supabase.rpc('increment_referral_count', { code: code.toUpperCase().trim() })

  return NextResponse.json({ success: true, credit: REFERRED_CREDIT })
}