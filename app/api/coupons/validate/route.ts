// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: 'Kupon kodu gerekli' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Geçersiz kupon kodu' })
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Kupon süresi dolmuş' })
    }

    // Check max uses
    if (data.max_uses && data.used_count >= data.max_uses) {
      return NextResponse.json({ valid: false, error: 'Kupon kullanım limiti dolmuş' })
    }

    return NextResponse.json({
      valid: true,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      max_discount: data.max_discount,
      min_order_amount: data.min_order_amount,
    })
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 })
  }
}