// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getUser(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

  const { data: refCode } = await supabaseAdmin
    .from('referral_codes')
    .select('code, used_count')
    .eq('user_id', user.id)
    .single()

  const { data: usages } = await supabaseAdmin
    .from('referral_usages')
    .select('referred_id, referrer_credit, created_at, users!referred_id(full_name)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('platform_credit')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    code:            refCode?.code ?? null,
    used_count:      refCode?.used_count ?? 0,
    total_earned:    (usages ?? []).reduce((s, u: any) => s + (u.referrer_credit ?? 0), 0),
    platform_credit: profile?.platform_credit ?? 0,
    usages:          usages ?? [],
  })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Kod gerekli' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('referral_usages')
    .select('id')
    .eq('referred_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Zaten bir referans kodu kullandınız.' }, { status: 400 })

  const { data: refCode } = await supabaseAdmin
    .from('referral_codes')
    .select('user_id, code')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (!refCode) return NextResponse.json({ error: 'Geçersiz referans kodu.' }, { status: 400 })

  if (refCode.user_id === user.id) {
    return NextResponse.json({ error: 'Kendi referans kodunuzu kullanamazsınız.' }, { status: 400 })
  }

  const REFERRER_CREDIT = 20
  const REFERRED_CREDIT = 10

  await supabaseAdmin.from('referral_usages').insert({
    referrer_id:     refCode.user_id,
    referred_id:     user.id,
    code:            code.toUpperCase().trim(),
    referrer_credit: REFERRER_CREDIT,
    referred_credit: REFERRED_CREDIT,
  })

  await supabaseAdmin.rpc('increment_platform_credit', {
    user_id: refCode.user_id,
    amount:  REFERRER_CREDIT,
  })

  await supabaseAdmin.rpc('increment_platform_credit', {
    user_id: user.id,
    amount:  REFERRED_CREDIT,
  })

  await supabaseAdmin.rpc('increment_referral_count', { code: code.toUpperCase().trim() })

  return NextResponse.json({ success: true, credit: REFERRED_CREDIT })
}