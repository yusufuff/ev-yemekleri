// @ts-nocheck
/**
 * POST /api/payments
 * Verilen order_id iÃ§in Ä°yzico Checkout Form baÅŸlatÄ±r.
 * SipariÅŸ daha Ã¶nce /api/orders ile oluÅŸturulmuÅŸ olmalÄ±.
 *
 * GET /api/payments/callback (ayrÄ± dosyada)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'
import { initCheckoutForm } from '@/lib/iyzico'

const schema = z.object({
  order_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user) {
    return NextResponse.json({ error: 'GiriÅŸ yapmanÄ±z gerekiyor.' }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'GeÃ§ersiz sipariÅŸ ID.' }, { status: 400 })
  }

  const { order_id } = parsed.data
  const supabase = await getSupabaseServerClient()

  // SipariÅŸi Ã§ek (RLS buyer_id = user.id kontrolÃ¼ yapar)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (item_name, item_price, quantity, notes),
      chef_profiles!inner (
        id,
        users!inner (full_name)
      )
    `)
    .eq('id', order_id)
    .eq('buyer_id', user.id)
    .eq('payment_status', 'pending')
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'SipariÅŸ bulunamadÄ±.' }, { status: 404 })
  }

  // KullanÄ±cÄ± bilgilerini Ã§ek
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  // Teslimat adresi
  const addr = order.delivery_address as any
  const city    = addr?.city    ?? 'Adana'
  const address = addr?.full_address ?? 'TÃ¼rkiye'

  // Ä°yzico'yu baÅŸlat
  const result = await initCheckoutForm({
    orderId:     order.id,
    orderNumber: order.order_number,
    amount:      Number(order.total_amount),
    buyerId:     user.id,
    buyerName:   profile?.full_name ?? 'KullanÄ±cÄ±',
    buyerPhone:  profile?.phone ?? '+905550000000',
    buyerEmail:  `${user.id.slice(0, 8)}@evyemekleri.com`,
    city,
    address,
    items: (order.order_items ?? []).map((item: any) => ({
      id:       item.menu_item_id ?? item.id ?? 'item',
      name:     item.item_name,
      price:    Number(item.item_price),
      category: 'Ev YemeÄŸi',
      quantity: item.quantity,
    })),
  })

  if (!result.success) {
    return NextResponse.json({
      error: result.error ?? 'Ã–deme baÅŸlatÄ±lamadÄ±. LÃ¼tfen tekrar deneyin.'
    }, { status: 502 })
  }

  // Token'Ä± sipariÅŸe kaydet (callback'te doÄŸrulama iÃ§in)
  await supabase
    .from('orders')
    .update({ iyzico_token: result.token })
    .eq('id', order.id)

  return NextResponse.json({
    success:               true,
    order_id:              order.id,
    order_number:          order.order_number,
    checkout_form_content: result.content,
    token:                 result.token,
  })
}



