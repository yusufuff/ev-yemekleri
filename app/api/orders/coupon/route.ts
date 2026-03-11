/**
 * POST /api/orders/coupon
 * Kupon kodunu doÄŸrular, indirim miktarÄ±nÄ± hesaplar.
 * Body: { code: string, subtotal: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

const schema = z.object({
  code:     z.string().min(1).max(30).transform(s => s.toUpperCase().trim()),
  subtotal: z.number().positive(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) {
    return NextResponse.json({ error: 'GiriÅŸ yapmanÄ±z gerekiyor.' }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'GeÃ§ersiz istek.' }, { status: 400 })
  }

  const { code, subtotal } = parsed.data
  const supabase = await getSupabaseServerClient()

  // Kuponu bul
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (error || !coupon) {
    return NextResponse.json({
      valid: false,
      error: 'Kupon bulunamadÄ± veya geÃ§erli deÄŸil.',
    })
  }

  // SÃ¼re kontrolÃ¼
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({
      valid: false,
      error: 'Bu kuponun sÃ¼resi dolmuÅŸ.',
    })
  }

  // KullanÄ±m limiti
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({
      valid: false,
      error: 'Bu kupon tÃ¼kenmiÅŸ.',
    })
  }

  // Minimum sipariÅŸ tutarÄ±
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    return NextResponse.json({
      valid: false,
      error: `Bu kupon iÃ§in minimum sipariÅŸ tutarÄ± â‚º${coupon.min_order_amount}.`,
    })
  }

  // Ä°lk sipariÅŸ kontrolÃ¼
  if (coupon.first_order_only) {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', user.id)
      .eq('payment_status', 'paid')

    if ((count ?? 0) > 0) {
      return NextResponse.json({
        valid: false,
        error: 'Bu kupon yalnÄ±zca ilk sipariÅŸte geÃ§erlidir.',
      })
    }
  }

  // KullanÄ±cÄ± baÅŸÄ±na limit
  if (coupon.per_user_limit) {
    const { count } = await supabase
      .from('coupon_usages')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', user.id)

    if ((count ?? 0) >= coupon.per_user_limit) {
      return NextResponse.json({
        valid: false,
        error: 'Bu kuponu zaten kullandÄ±nÄ±z.',
      })
    }
  }

  // Ä°ndirim hesapla
  let discount = 0
  if (coupon.discount_type === 'percentage') {
    discount = subtotal * (coupon.discount_value / 100)
    if (coupon.max_discount) {
      discount = Math.min(discount, coupon.max_discount)
    }
  } else {
    discount = coupon.discount_value
  }

  discount = Math.min(Math.round(discount * 100) / 100, subtotal)

  return NextResponse.json({
    valid:          true,
    code:           coupon.code,
    discount_type:  coupon.discount_type,
    discount_value: coupon.discount_value,
    max_discount:   coupon.max_discount,
    description:    coupon.description ?? `${code} kuponu`,
    discount_amount: discount,
  })
}


